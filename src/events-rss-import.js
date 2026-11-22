import { SaxesParser } from 'saxes';

const ucf = {
  id: 'ucf',
  name: 'University of Central Florida',
  origin: 'https://events.ucf.edu',
  timezone: 'America/New_York',
  categories: [
    ['/category/23/speakerlectureseminar/feed.rss', 'Speaker/Lecture/Seminar', 'seminar'],
    ['/category/29/workshopconference/feed.rss', 'Workshop/Conference', 'workshop'],
  ],
};
const mps = {
  id: 'mps',
  name: 'Max Planck Institute for Solar System Research',
  origin: 'https://www.mps.mpg.de',
  timezone: 'Europe/Berlin',
};
// Exact organizer venue names checked against their published addresses.
const ucfOrlandoVenues = new Set([
  'Kenneth G. Dixon Career Development Center: 121',
  'National Entrepreneur Center: Venture Training Room',
  'Rosen College of Hospitality Management: Darden Auditorium',
  'Visual Arts Building: 215: Visual Arts',
]);
const mpsGoettingenVenues = new Set([
  'Max-Planck-Institut für Sonnensystemforschung',
  'Max Planck Institute for Solar System Research',
]);
const maxFeedBytes = 2_000_000;
const day = 86_400_000;
const months = new Map('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
  .map((month, index) => [month, String(index + 1).padStart(2, '0')]));
const kinds = [
  ['webinar', /\bwebinars?\b/i],
  ['workshop', /\bworkshops?\b/i],
  ['symposium', /\bsymposi(?:a|ums?)\b/i],
  ['conference', /\bconferences?\b/i],
  ['seminar', /\bseminars?\b/i],
];
const itemPath = 'rss/channel/item';
const commonFields = [
  ['title', 'title'],
  ['link', 'link'],
  ['description', 'description'],
];
const ucfFields = eventFields([
  ...commonFields,
  ['ucf:category', 'category'],
  ['ucf:startdate', 'startDate'],
  ['ucf:enddate', 'endDate'],
  ['ucf:location/ucf:name', 'venue'],
  ['ucf:location/ucf:virtualurl', 'virtualLocation'],
]);
const mpsFields = eventFields(commonFields);

function eventFields(paths) {
  return new Map(paths.map(([path, key]) => [itemPath + '/' + path, key]));
}

function parseFeed(xml, fields) {
  const parser = new SaxesParser({ xmlns: true });
  const stack = [];
  const entries = [];
  let channels = 0;
  let item;
  let captured;
  function collect(value) {
    if (captured) item[captured.key] += value;
  }
  parser.on('doctype', () => { throw new Error('RSS document types are unsupported'); });
  parser.on('opentag', ({ local, uri }) => {
    if (stack.length >= 32) throw new Error('RSS is nested too deeply');
    stack.push(uri === ucf.origin ? 'ucf:' + local : uri === '' ? local : '');
    const path = stack.join('/');
    if (path === 'rss/channel') channels += 1;
    if (path === itemPath) item = {};
    const key = fields.get(path);
    if (item && key) {
      if (Object.hasOwn(item, key)) throw new Error('RSS entry has a duplicate event field');
      captured = { key, depth: stack.length };
      item[key] = '';
    }
  });
  parser.on('text', collect);
  parser.on('cdata', collect);
  parser.on('closetag', () => {
    if (captured?.depth === stack.length) captured = undefined;
    if (stack.join('/') === itemPath) {
      entries.push(item);
      item = undefined;
    }
    stack.pop();
  });
  parser.write(xml).close();
  if (channels !== 1) throw new Error('Expected one RSS 2.0 channel');
  return entries;
}

async function feedText(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('Organizer RSS returned HTTP ' + response.status);
  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!['application/rss+xml', 'application/xml', 'text/xml'].includes(contentType) || !response.body) {
    throw new Error('Organizer did not return an XML feed');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const parts = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxFeedBytes) throw new Error('Organizer RSS exceeds the size limit');
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join('');
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function clean(value, maxLength) {
  return (value || '').replace(/\s+/gu, ' ').trim().slice(0, maxLength);
}

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
const languages = new Map([
  ...['ar', 'bn', 'de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'tr', 'zh']
    .map(code => [languageNames.of(code).toLowerCase(), code]),
  ['bengali', 'bn'],
  ['deutsch', 'de'],
  ['mandarin', 'zh'],
]);

function declaredLanguageFields(description = '', explicitLanguage = '') {
  const lines = description.replace(/<\/?(?:p|br|li|div)\b[^>]*>/gi, '\n').replace(/<[^>]*>/g, ' ');
  const statements = lines.matchAll(/(?:^|[.\n!?])[ \t]*(?:(?:event|seminar|conference|workshop|webinar|talk|session|spoken) languages?[ \t]*:[ \t]*|(?:(?:this|the) )?(?:event|seminar|conference|workshop|webinar|talk|session) (?:is|will be) (?:held|presented|conducted|delivered) in )([^\n.!?]+)/gi);
  const declared = new Set();
  for (const value of [explicitLanguage, ...Array.from(statements, match => match[1])]) {
    const names = clean(value, 200).toLowerCase().replace(/^both\s+/, '').split(/\s*,\s*(?:and\s+)?|\s+and\s+/);
    const codes = names.map(name => languages.get(name));
    if (codes.every(Boolean)) for (const code of codes) declared.add(code);
  }
  const [language, ...additional] = declared;
  return language ? { language, ...(additional.length ? { languages: additional } : {}) } : {};
}

function organizerEvent(value, origin, pathPattern) {
  try {
    const url = new URL(value || '');
    const id = pathPattern.exec(url.pathname)?.[1];
    if (url.origin === origin && !url.username && !url.password && id) {
      return { id, url: url.origin + url.pathname };
    }
  } catch {
    // Ignore links that do not lead to an event on the organizer's calendar.
  }
  return null;
}

function calendarDate(year, month, date) {
  const day = year + '-' + months.get(month) + '-' + date.padStart(2, '0');
  const parsed = new Date(day);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === day ? day : '';
}

const zoneOffset = new Intl.DateTimeFormat('en', { timeZone: ucf.timezone, timeZoneName: 'longOffset' });
function dateTime(value) {
  const match = /^(?:[A-Za-z]{3}, )?(\d{1,2}) ([A-Za-z]{3}) (\d{4}) ((?:[01]\d|2[0-3]):[0-5]\d):([0-5]\d) ([+-]\d{2})([0-5]\d)$/.exec(value?.trim());
  if (!match) return null;
  const [, dayOfMonth, month, year, time, seconds, hourOffset, minuteOffset] = match;
  const date = calendarDate(year, month, dayOfMonth);
  const offset = hourOffset + ':' + minuteOffset;
  const moment = Date.parse(date + 'T' + time + ':' + seconds + offset);
  if (!date || !Number.isFinite(moment) ||
      zoneOffset.formatToParts(moment).find(({ type }) => type === 'timeZoneName')?.value !== 'GMT' + offset) {
    return null;
  }
  return { date, time, moment };
}

function onlineLocation(value) {
  try {
    return ['https:', 'http:'].includes(new URL(value || '').protocol);
  } catch {
    return false;
  }
}

function statusExcluded(title) {
  return !title || /\b(?:cancel(?:l)?ed|postponed|template|test event)\b/i.test(title);
}

function eventRecord(source, title, organizer, fields) {
  return {
    id: 'directory-' + organizer.id + '-' + source.id,
    type: 'event',
    title,
    description: 'See the organizer’s event page for the program and participation details.',
    metadataLanguage: 'en',
    institution: organizer.name,
    timezone: organizer.timezone,
    sourceUrl: source.url,
    directory: true,
    ...fields,
  };
}

function ucfRecord(entry, category, fallback, from, to) {
  const title = clean(entry.title, 250);
  const kind = kinds.find(([, pattern]) => pattern.test(title))?.[0];
  const eventType = kind || (/\bresearch\b/i.test(title) ? fallback : '');
  const source = organizerEvent(entry.link?.trim(), ucf.origin, /^\/event\/([1-9]\d*)(?:\/[^/]+)?\/?$/u);
  const start = dateTime(entry.startDate);
  const end = dateTime(entry.endDate);
  if (!eventType || entry.category?.trim() !== category || !source ||
      !start || !end || end.moment < start.moment || end.date < from || start.date >= to ||
      statusExcluded(title)) {
    return null;
  }
  const venue = clean(entry.venue, 150);
  const online = onlineLocation(entry.virtualLocation?.trim());
  const mode = online ? (venue ? 'hybrid' : 'online') : (venue ? 'inPerson' : '');
  const location = ucfOrlandoVenues.has(venue) ? { countryCode: 'US', country: 'United States', city: 'Orlando' } : {};
  return eventRecord(source, title, ucf, {
    eventType,
    startDate: start.date,
    endDate: end.date,
    startTime: start.time,
    endTime: end.time,
    ...(venue ? { venue } : {}),
    ...(mode ? { mode } : {}),
    ...location,
    ...declaredLanguageFields(entry.description),
  });
}

function seminarMetadata(html = '') {
  const fields = new Map();
  for (const line of html.split(/<br\s*\/?\s*>/i)) {
    const match = /^\s*<strong>(Date|Location|Room|Language|Summary)<\/strong>:\s*([^<]*)/.exec(line);
    if (!match) continue;
    if (match[1] === 'Summary') break;
    if (fields.has(match[1])) {
      if (match[1] !== 'Language') return new Map();
      fields.set('Language', '');
      continue;
    }
    fields.set(match[1], match[2].trim());
  }
  return fields;
}

function twelveHourClock(hour, minute, period) {
  return String(Number(hour) % 12 + (period === 'PM' ? 12 : 0)).padStart(2, '0') + ':' + minute;
}

function mpsRecord(entry, from, to) {
  const title = clean(entry.title, 250);
  const source = organizerEvent(entry.link?.trim(), mps.origin, /^\/events\/([1-9]\d*)(?:\/[1-9]\d*)?\/?$/u);
  if (!source || statusExcluded(title)) return null;
  const fields = seminarMetadata(entry.description);
  const match = /^([A-Za-z]{3}) (\d{1,2}), (\d{4}) (0?[1-9]|1[0-2]):([0-5]\d) (AM|PM) - (0?[1-9]|1[0-2]):([0-5]\d) (AM|PM) \(Local Time Germany\)$/.exec(fields.get('Date'));
  if (!match) return null;
  const [, month, date, year, startHour, startMinute, startPeriod, endHour, endMinute, endPeriod] = match;
  const day = calendarDate(year, month, date);
  const startTime = twelveHourClock(startHour, startMinute, startPeriod);
  const endTime = twelveHourClock(endHour, endMinute, endPeriod);
  if (!day || day < from || day >= to || endTime < startTime) return null;
  const location = fields.get('Location');
  const room = fields.get('Room');
  const online = onlineLocation(room);
  const venue = clean([location, online ? '' : room].filter(Boolean).join(', '), 150);
  const mode = online ? (venue ? 'hybrid' : 'online') : (venue ? 'inPerson' : '');
  const geography = mpsGoettingenVenues.has(clean(location, 150).normalize('NFC'))
    ? { countryCode: 'DE', country: 'Germany', city: 'Göttingen' } : {};
  return eventRecord(source, title, mps, {
    eventType: 'seminar',
    startDate: day,
    endDate: day,
    startTime,
    endTime,
    ...(venue ? { venue } : {}),
    ...(mode ? { mode } : {}),
    ...geography,
    ...declaredLanguageFields(entry.description, fields.get('Language')),
  });
}

async function ucfListings({ from, to, fetchImpl }) {
  const pages = await Promise.all(ucf.categories.map(async ([path, category, fallback]) =>
    parseFeed(await feedText(ucf.origin + path, fetchImpl), ucfFields)
      .map((entry) => ucfRecord(entry, category, fallback, from, to)).filter(Boolean)));
  return pages.flat();
}

async function mpsListings({ from, to, fetchImpl }) {
  const xml = await feedText(mps.origin + '/news/seminars.rss', fetchImpl);
  return parseFeed(xml, mpsFields).map((entry) => mpsRecord(entry, from, to)).filter(Boolean);
}

export async function fetchOrganizerRss({
  from = new Date().toISOString().slice(0, 10),
  to = new Date(Date.parse(from) + 120 * day).toISOString().slice(0, 10),
  fetchImpl = fetch,
} = {}) {
  const feeds = [[ucf, ucfListings], [mps, mpsListings]];
  const results = await Promise.allSettled(feeds.map(([, load]) => load({ from, to, fetchImpl })));
  const records = [];
  const successfulSources = [];
  const failedSources = [];
  for (const [index, result] of results.entries()) {
    const [{ id, name }] = feeds[index];
    if (result.status === 'fulfilled') {
      const unique = [...new Map(result.value.map((entry) => [entry.id, entry])).values()];
      records.push(...unique);
      successfulSources.push({ id, name, count: unique.length });
    } else {
      failedSources.push({ id, name, error: result.reason });
    }
  }
  return { records, successfulSources, failedSources };
}
