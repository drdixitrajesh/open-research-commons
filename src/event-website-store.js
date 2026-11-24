import subjects from '../dist/data/subjects.json' with { type:'json' };
import countries from '../dist/data/countries.json' with { type:'json' };
import { normalizeEventWebsite, renderPublishedEventWebsite } from '../dist/planner-website.js';
import { plannerClassificationSnapshot } from '../dist/planner-classification.js';
import { ApiError } from './doi.js';

const idPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const websitePath = /^\/event-sites\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/?$/;
const eventTypes = new Set(['seminar','symposium','workshop','webinar','conference','other']);
const defaultOrigin = 'https://conference.softinator.org';
const pageHeaders = {
  'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

function ownedSite(row, origin) {
  return {
    id:row.id, url:new URL('/event-sites/' + row.id,origin).href,
    record:JSON.parse(row.record_json), published:row.published === 1, updatedAt:row.updated_at,
  };
}

export async function listEventWebsites(db, user, type, origin = defaultOrigin) {
  if (!eventTypes.has(type)) throw new ApiError(422,'invalid_event_type','Choose an event type.');
  const rows = await db.prepare('SELECT id,record_json,published,updated_at FROM event_websites ' +
    'WHERE owner_id IN (?,?) AND event_type=? AND published=1 ORDER BY updated_at DESC, id DESC')
    .bind(user.id,user.secondaryOwnerId || user.id,type).all();
  return { sites:rows.results.map(row => ownedSite(row,origin)) };
}

export async function writeEventWebsite(db, user, input, origin = defaultOrigin) {
  const id = input.siteId || crypto.randomUUID();
  if (typeof id !== 'string' || !idPattern.test(id)) throw new ApiError(422,'invalid_website','Choose a valid event website.');
  const now = new Date().toISOString();
  const secondary = user.secondaryOwnerId || user.id;
  if (input.action === 'unpublish') {
    if (!input.siteId) throw new ApiError(422,'invalid_website','Choose an event website to unpublish.');
    const result = await db.prepare('UPDATE event_websites SET published=0,updated_at=? WHERE id=? AND owner_id IN (?,?)')
      .bind(now,id,user.id,secondary).run();
    if (!result.meta.changes) throw new ApiError(404,'website_not_found','This event website could not be found.');
    return { id, published:false };
  }
  if (input.action !== 'publish' || input.consent !== true) {
    throw new ApiError(422,'publication_consent','Confirm that these details can be published.');
  }
  const record = normalizeEventWebsite(input.record);
  if (!record.title || !eventTypes.has(input.record?.eventType)) {
    throw new ApiError(422,'invalid_event','Enter an event title and type.');
  }
  record.classification = plannerClassificationSnapshot(input.record.classification, { subjects,countries,language:record.language });
  const result = await db.prepare('INSERT INTO event_websites (id,owner_id,event_type,record_json,published,updated_at) VALUES (?,?,?,?,1,?) ' +
    'ON CONFLICT(id) DO UPDATE SET record_json=excluded.record_json,published=1,updated_at=excluded.updated_at ' +
    'WHERE event_websites.owner_id IN (?,?) AND event_websites.event_type=excluded.event_type')
    .bind(id,user.id,record.eventType,JSON.stringify(record),now,user.id,secondary).run();
  if (!result.meta.changes) throw new ApiError(404,'website_not_found','This event website could not be found.');
  return { id, url:new URL('/event-sites/' + id,origin).href, published:true, updatedAt:now };
}

export async function publicEventWebsite(request, db) {
  const id = websitePath.exec(new URL(request.url).pathname)?.[1];
  const head = request.method === 'HEAD';
  if (!id || !db) return new Response(head ? null : 'Event website not found', { status:404, headers:{'Cache-Control':'no-store'} });
  const row = await db.prepare('SELECT record_json FROM event_websites WHERE id=? AND published=1').bind(id).first();
  if (!row) return new Response(head ? null : 'Event website not found', { status:404, headers:{'Cache-Control':'no-store'} });
  return new Response(head ? null : renderPublishedEventWebsite(JSON.parse(row.record_json)), { headers:pageHeaders });
}
