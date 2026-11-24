import countries from '../dist/data/countries.json' with { type: 'json' };
import { ApiError } from './doi.js';
import { hmac, normalizedEmail, reserveRateLimits } from './email-auth.js';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const countryCodes = new Set(countries.map(({ iso }) => iso));
const eventTypes = new Set(['conference', 'seminar', 'symposium', 'workshop', 'webinar', 'other']);
const formModes = new Set(['', 'inPerson', 'online', 'hybrid']);
const participantModes = new Set(['', 'inPerson', 'online']);
const formScope = 'event-registration-form';
const addressScope = 'event-registration-address';
const rateWindow = 10 * 60;
const pageSize = 100;
const encoder = new TextEncoder();
const formColumns = 'id, title, event_type, mode, is_open, updated_at';

const missingForm = () => new ApiError(404, 'registration_not_found', 'This registration form could not be found.');
const closedForm = () => new ApiError(409, 'registration_closed', 'Registration for this event is closed.');
const invalid = (field, message) => new ApiError(422, 'invalid_field', message, field);

function formId(value) {
  return typeof value === 'string' && uuid.test(value) ? value.toLowerCase() : '';
}

function textField(value, field, label, max, required = false) {
  if (value == null) value = '';
  if (typeof value !== 'string') throw invalid(field, 'Enter a valid ' + label + '.');
  const normalized = value.trim().normalize('NFC');
  if (required && !normalized) throw invalid(field, 'Enter ' + label + '.');
  if (normalized.length > max || /[\u0000-\u001f\u007f-\u009f]/u.test(normalized)) {
    throw invalid(field, 'Enter ' + label + ' using no more than ' + max + ' characters on one line.');
  }
  return normalized;
}

function publicForm(row) {
  return { id: row.id, title: row.title, type: row.event_type, mode: row.mode, open: row.is_open === 1 };
}

function ownedForm(row) {
  return { ...publicForm(row), updatedAt: row.updated_at, participantCount: row.participant_count };
}

const participantCount = '(SELECT count(*) FROM event_registration_participants p WHERE p.form_id = event_registration_forms.id) AS participant_count';

function decodeCursor(cursor) {
  if (cursor == null || cursor === '') return [];
  const [date, id, extra] = cursor.split('~');
  if (extra !== undefined || !timestamp.test(date) || !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString() !== date || !formId(id)) {
    throw new ApiError(400, 'bad_cursor', 'This registration results page could not be found.');
  }
  return [date, formId(id)];
}

export async function listEventRegistrations(db, user, url) {
  const type = url.searchParams.get('type');
  if (!eventTypes.has(type)) throw invalid('type', 'Choose an event type.');
  const cursor = decodeCursor(url.searchParams.get('cursor'));
  const { results } = await db.prepare(`
    SELECT ${formColumns}, ${participantCount}
    FROM event_registration_forms
    WHERE owner_id IN (?, ?) AND event_type = ? ${cursor.length ? 'AND (updated_at, id) < (?, ?)' : ''}
    ORDER BY updated_at DESC, id DESC LIMIT ?
  `).bind(user.id, user.secondaryOwnerId || user.id, type, ...cursor, pageSize + 1).all();
  const page = results.slice(0, pageSize);
  const last = page.at(-1);
  return {
    forms: page.map(ownedForm),
    nextCursor: results.length > pageSize ? last.updated_at + '~' + last.id : null,
  };
}

export async function saveEventRegistration(db, user, input) {
  if (input.action !== 'save') throw new ApiError(400, 'bad_action', 'Choose a registration action.');
  const id = formId(input.id);
  if (!id) throw invalid('id', 'Choose a valid registration form.');
  const title = textField(input.title, 'title', 'an event title', 240, true);
  const { type, open } = input;
  const mode = input.mode ?? '';
  if (!eventTypes.has(type)) throw invalid('type', 'Choose an event type.');
  if (!formModes.has(mode)) throw invalid('mode', 'Choose a participation mode.');
  if (typeof open !== 'boolean') throw invalid('open', 'Choose whether registration is open.');
  const { results } = await db.prepare(`
    INSERT INTO event_registration_forms (id, owner_id, title, event_type, mode, is_open, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      updated_at = CASE
        WHEN event_registration_forms.title = excluded.title AND event_registration_forms.event_type = excluded.event_type
          AND event_registration_forms.mode = excluded.mode AND event_registration_forms.is_open = excluded.is_open
        THEN event_registration_forms.updated_at ELSE excluded.updated_at END,
      title = excluded.title, event_type = excluded.event_type, mode = excluded.mode, is_open = excluded.is_open
    WHERE event_registration_forms.owner_id IN (?, ?)
    RETURNING ${formColumns}, ${participantCount}
  `).bind(id, user.id, title, type, mode, Number(open), new Date().toISOString(), user.id, user.secondaryOwnerId || user.id).all();
  if (!results.length) throw missingForm();
  return { form: ownedForm(results[0]) };
}

export async function listRegistrationParticipants(db, user, idValue, url) {
  const id = formId(idValue);
  if (!id) throw missingForm();
  const cursor = decodeCursor(url.searchParams.get('cursor'));
  const { results } = await db.prepare(`
    SELECT p.id, p.name, p.email, p.organization, p.country, p.mode, p.created_at
    FROM event_registration_forms f
    LEFT JOIN event_registration_participants p
      ON p.form_id = f.id ${cursor.length ? 'AND (p.created_at, p.id) < (?, ?)' : ''}
    WHERE f.id = ? AND f.owner_id IN (?, ?)
    ORDER BY p.created_at DESC, p.id DESC LIMIT ?
  `).bind(...cursor, id, user.id, user.secondaryOwnerId || user.id, pageSize + 1).all();
  if (!results.length) throw missingForm();
  const page = results.slice(0, pageSize).filter(row => row.id);
  const last = page.at(-1);
  return {
    participants: page.map(({ created_at, ...person }) => ({ ...person, createdAt: created_at })),
    nextCursor: results.length > pageSize ? last.created_at + '~' + last.id : null,
  };
}

function findForm(db, id) {
  return db.prepare('SELECT ' + formColumns + ' FROM event_registration_forms WHERE id = ?').bind(id);
}

export async function getPublicRegistration(db, idValue) {
  const id = formId(idValue);
  const row = id && await findForm(db, id).first();
  if (!row) throw missingForm();
  return { form: publicForm(row) };
}

function checkAttendance(form, mode) {
  if (!form) throw missingForm();
  if (form.is_open !== 1) throw closedForm();
  if (form.mode === 'hybrid' && !mode) throw invalid('mode', 'Choose how you will attend.');
  if (['inPerson', 'online'].includes(form.mode) && mode && mode !== form.mode) {
    throw invalid('mode', 'Choose an attendance mode offered by this event.');
  }
}

async function reserveRegistration(env, request, id, now) {
  const limits = [[formScope, id, rateWindow, 500]];
  // The edge supplies this value. Save a scoped digest rather than the address.
  const ip = request.headers.get('CF-Connecting-IP');
  const secret = env.AUTH_SECRET;
  if (ip && ip.length <= 64 && /^[0-9a-f.:]+$/i.test(ip) &&
      typeof secret === 'string' && encoder.encode(secret).length >= 32) {
    const period = Math.floor(now / rateWindow);
    const address = await hmac(secret, addressScope, id + '\0' + period + '\0' + ip);
    limits.push([addressScope, address, rateWindow, 100]);
  }
  if (!(await reserveRateLimits(env.DB, now, limits))) {
    throw new ApiError(429, 'rate_limited', 'Please wait before trying to register again.');
  }
}

export async function registerParticipant(env, request, idValue, input) {
  const db = env.DB;
  const id = formId(idValue);
  if (!id) throw missingForm();
  const form = await findForm(db, id).first();
  if (!form) throw missingForm();
  if (form.is_open !== 1) throw closedForm();
  if (input.website != null && input.website !== '') return { ok: true };

  const name = textField(input.name, 'name', 'your name', 160, true);
  const email = normalizedEmail(input.email);
  if (!email) throw invalid('email', 'Enter a valid email address.');
  const organization = textField(input.organization, 'organization', 'your organization', 240);
  const country = typeof input.country === 'string' ? input.country.trim().toUpperCase() : input.country ?? '';
  if (country !== '' && !countryCodes.has(country)) throw invalid('country', 'Choose a valid country.');
  const mode = input.mode ?? '';
  if (!participantModes.has(mode)) throw invalid('mode', 'Choose how you will attend.');
  checkAttendance(form, mode);

  const now = new Date();
  const seconds = Math.floor(now.getTime() / 1000);
  await reserveRegistration(env, request, id, seconds);
  // Recheck the open flag and mode in the same transaction as the insert. A
  // duplicate returns the same success without exposing or replacing its data.
  const [written, current] = await db.batch([
    db.prepare(`
      INSERT INTO event_registration_participants (id, form_id, name, email, organization, country, mode, created_at)
      SELECT ?, id, ?, ?, ?, ?, CASE WHEN mode IN ('inPerson', 'online') THEN mode ELSE ? END, ?
      FROM event_registration_forms
      WHERE id = ? AND is_open = 1
        AND (mode = '' OR (mode = 'hybrid' AND ? <> '') OR (mode IN ('inPerson', 'online') AND ? IN ('', mode)))
      ON CONFLICT(form_id, email) DO NOTHING
    `).bind(crypto.randomUUID(), name, email, organization, country, mode, now.toISOString(), id, mode, mode),
    findForm(db, id),
    db.prepare('DELETE FROM auth_rate_limits WHERE reset_at <= ? AND scope IN (?, ?)').bind(seconds, formScope, addressScope),
  ]);
  if (!written.meta.changes) checkAttendance(current.results[0], mode);
  return { ok: true };
}
