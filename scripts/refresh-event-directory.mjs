import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { fetchOrganizerRss } from '../src/events-rss-import.js';
import { organizerEventSubjectCodes } from '../src/organizer-event-subjects.js';

const output = new URL('../dist/data/events-feed.json', import.meta.url);
const archiveIndex = new URL('./events-archive-index.json', output);
const archiveFile = year => new URL(`./events-archive-${year}.json`, output);
const defaultFrom = new Date().toISOString().slice(0, 10);
const from = process.argv.find((arg) => arg.startsWith('--from='))?.slice(7) ?? defaultFrom;
const parsedFrom = new Date(from);
if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !Number.isFinite(parsedFrom.valueOf()) ||
    parsedFrom.toISOString().slice(0, 10) !== from) {
  throw new Error('Use --from=YYYY-MM-DD with a valid calendar date.');
}

const days = 120;
const to = new Date(parsedFrom.valueOf() + days * 86_400_000).toISOString().slice(0, 10);
const overlapFrom = new Date(parsedFrom.valueOf() - 86_400_000).toISOString().slice(0, 10);
const countries = new Intl.DisplayNames(['en'], { type: 'region' });
const countryData = JSON.parse(await readFile(new URL('../dist/data/countries.json', import.meta.url), 'utf8'));
const explicitCountries = new Map(countryData.flatMap(({ iso, name }) => [
  [name.toLowerCase(), iso], [countries.of(iso).toLowerCase(), iso],
]));
const countryCodes = new Set(countryData.map(({ iso }) => iso));
// Explicit venues in the public organizer feeds, checked against their host institutions.
const locations = new Map([
  ['harvard science center', ['US', 'Cambridge']],
  ['samberg conference center', ['US', 'Cambridge']],
  ['mansoura university', ['EG', 'Mansoura']],
  ['uta|cpb303', ['US', 'Arlington']],
  ['centro brasileiro de pesquisas fisicas', ['BR', 'Rio de Janeiro']],
  ['playa del carmen', ['MX', 'Playa del Carmen']],
  ['central building of the national and kapodistrian university of athens', ['GR', 'Athens']],
  ['thon hotel skeikampen', ['NO', 'Svingvoll']],
  ['university of trento and fbk', ['IT', 'Trento']],
  ['bambolim beach resort, goa, india', ['IN', 'Bambolim']],
  ['esrf, grenoble', ['FR', 'Grenoble']],
  ['wydział fizyki uw', ['PL', 'Warsaw']],
  ['cern|503/1-001', ['CH', 'Meyrin']],
  ['cern|4/3-006', ['CH', 'Meyrin']],
  ['cern|31/3-004', ['CH', 'Meyrin']],
]);
const languageCodes = ['en', 'ar', 'bn', 'zh', 'nl', 'fr', 'de', 'hi', 'it', 'ja', 'ko', 'no', 'pl', 'pt', 'ru', 'es', 'sv', 'tr'];
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
const languagesByName = new Map(languageCodes.map((code) => [languageNames.of(code).toLowerCase(), code]));
const languageNamesPattern = '(?:' + [...languagesByName.keys()].join('|') + ')';
const spokenLanguageStatement = new RegExp(
  '\\b(?:(?:(?:official|working|spoken|conference|event|meeting|workshop) languages?)\\s*(?::|is\\b|are\\b|will be\\b)|(?:talks|sessions|presentations|the event|the workshop|the conference) (?:will be (?:given|held|conducted) in|will be in))\\s*(' +
  languageNamesPattern + '(?:(?:\\s*,\\s*|\\s+and\\s+|\\s+or\\s+)' + languageNamesPattern + ')*)\\b', 'gi',
);
const typePatterns = [
  ['webinar', /\bwebinars?\b/i],
  ['workshop', /\bworkshops?\b/i],
  ['symposium', /\bsymposi(?:a|ums?)\b/i],
  ['conference', /\bconferences?\b/i],
  ['seminar', /\bseminars?\b/i],
];
const feeds = [
  {
    key: 'stanford', name: 'Stanford University', origin: 'https://events.stanford.edu',
    timezone: 'America/Los_Angeles',
    eventTypes: ['37952570025304', '37952570027353', '37952570047842'],
    audience: ['General Public', 'Everyone'],
  },
  {
    key: 'mit', name: 'Massachusetts Institute of Technology', origin: 'https://calendar.mit.edu',
    timezone: 'America/New_York',
    eventTypes: ['102764', '103222'], audience: ['Public'],
  },
  {
    key: 'cern', name: 'CERN Indico', origin: 'https://indico.cern.ch',
    // Keep public calendar references while the organizer's /export crawler preference applies.
    automatic: false,
    paths: ['/export/categ/6741.json', '/export/categ/6745.json'],
  },
];

async function getJson(origin, path, params) {
  const target = new URL(path, origin);
  target.search = new URLSearchParams(params).toString();
  const response = await fetch(target, {
    headers: { Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(18_000),
  });
  if (!response.ok) throw new Error('Organizer feed returned HTTP ' + response.status);
  return response.json();
}

function eventLink(origin, value) {
  if (!value) return '';
  try {
    const link = new URL(value);
    return link.origin === origin && /^\/event\/[^/?#]+\/?$/.test(link.pathname)
      ? link.origin + link.pathname
      : '';
  } catch {
    return '';
  }
}

function dateOnly(value) {
  return value?.match?.(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
}

function text(value, limit = 250) {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim().slice(0, limit) : '';
}

function kindOf(title, fallback) {
  return typePatterns.find(([, pattern]) => pattern.test(title))?.[0] || fallback;
}

function descriptionText(value) {
  return text(typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ') : '', 20_000);
}

function spokenLanguages(description) {
  const declared = new Set();
  for (const match of description.matchAll(spokenLanguageStatement)) {
    for (const name of match[1].toLowerCase().split(/\s*,\s*|\s+and\s+|\s+or\s+/)) {
      const code = languagesByName.get(name);
      if (code) declared.add(code);
    }
  }
  return [...declared];
}

function zone(value) {
  if (typeof value !== 'string' || !value) return '';
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return value; }
  catch { return ''; }
}

function clockTime(value) {
  return typeof value === 'string' ? /^(?:[01]\d|2[0-3]):[0-5]\d/.exec(value)?.[0] || '' : '';
}

function localistZone(calendarZone, value) {
  if (typeof value !== 'string') return '';
  const offset = /([+-]\d\d:\d\d)$/.exec(value)?.[1];
  const time = new Date(value);
  if (!offset || !Number.isFinite(time.valueOf())) return '';
  const display = new Intl.DateTimeFormat('en', { timeZone: calendarZone, timeZoneName: 'longOffset' });
  const expected = display.formatToParts(time).find(({ type }) => type === 'timeZoneName')?.value;
  return expected === 'GMT' + offset ? calendarZone : '';
}

function indicoLocation(event) {
  const place = text(event.location, 120);
  const parts = place.split(',').map((part) => part.trim());
  const venueKey = place.toLowerCase();
  const room = text(event.room, 30).toLowerCase().replace(/\s+/g, '');
  const known = locations.get(venueKey + '|' + room) || locations.get(venueKey);
  const markedCountry = explicitCountries.get(parts.at(-1).toLowerCase()) || '';
  const addressCountry = explicitCountries.get(text(event.address, 250).split(',').at(-1).trim().toLowerCase()) || '';
  const city = markedCountry && parts.length === 2 && /^[\p{L}\p{M} .'-]+$/u.test(parts[0]) ? parts[0] : '';
  return [markedCountry || addressCountry || known?.[0] || '', city || known?.[1] || ''];
}

function indicoMode(title, description, countryCode) {
  if (/\bhybrid\s+(?:event|format|meeting|workshop|conference)\b|\bin[- ]person\s+(?:event|meeting).{0,75}\b(?:remotely|online|virtually)\b/i.test(description)) return 'hybrid';
  if (/\b(?:online|virtual|webinar)\b/i.test(title) || /\b(?:will be held|will take place)\s+(?:online|virtually)\b/i.test(description)) return 'online';
  if (/\bin[- ]person only\b/i.test(description)) return 'inPerson';
  if (countryCode && /\b(?:will (?:be held|take place)|takes place)\s+(?:at|in)\b/i.test(description) &&
      !/\b(?:online|virtual|remotely)\b/i.test(description)) return 'inPerson';
  return '';
}

function record(feed, { key, title, start, end, sourceUrl, eventType, countryCode, city, mode, timezone, startTime, endTime, description }) {
  if (!title || !sourceUrl || !eventType || !start || !end || end < from || start >= to || end < start ||
      /\b(?:cancel(?:l)?ed|postponed|template|test event)\b/i.test(title)) return null;
  const entry = {
    id: 'directory-' + feed.key + '-' + key, type: 'event', eventType, title,
    description: 'See the organizer’s event page for the program and participation details.',
    metadataLanguage: 'en', institution: feed.name, startDate: start, endDate: end, sourceUrl, directory: true,
  };
  if (countryCodes.has(countryCode)) {
    entry.countryCode = countryCode;
    entry.country = countries.of(countryCode);
  }
  if (city) entry.city = city;
  if (mode) entry.mode = mode;
  if (timezone) entry.timezone = timezone;
  if (startTime) entry.startTime = startTime;
  if (endTime) entry.endTime = endTime;
  const spoken = spokenLanguages(description);
  if (spoken.length) entry.language = spoken[0];
  if (spoken.length > 1) entry.languages = spoken.slice(1);
  return entry;
}

async function localist(feed) {
  const records = [];
  const params = {
    start: from, days, pp: 100, match: 'any',
    ...Object.fromEntries(feed.eventTypes.map((id, i) => ['type[' + i + ']', id])),
  };
  for (let page = 1; page <= 3; page++) {
    const data = await getJson(feed.origin, '/api/2/events', { ...params, page });
    if (!Array.isArray(data.events)) throw new Error('Unexpected Localist feed shape');
    for (const { event } of data.events) {
      if (!event || event.status !== 'live' ||
          !event.filters?.event_audience?.some(({ name }) => feed.audience.includes(name))) continue;
      const sourceUrl = eventLink(feed.origin, event.localist_url);
      const title = text(event.title);
      // Broad categories also include fairs, talks, and classes. Import only named
      // types, except for Stanford's dedicated Workshop category.
      const workshop = event.filters?.event_types?.some(({ name }) => name === 'Workshop');
      const eventType = kindOf(title, workshop ? 'workshop' : '');
      const mode = { virtual: 'online', inperson: 'inPerson', hybrid: 'hybrid' }[event.experience];
      const known = locations.get(text(event.location_name, 120).toLowerCase());
      const countryCode = text(event.geo?.country, 2).toUpperCase() || known?.[0];
      const city = text(event.geo?.city, 80) || known?.[1];
      const description = descriptionText(event.description_text || event.description);
      for (const { event_instance: instance } of event.event_instances ?? []) {
        if (!instance || !Number.isSafeInteger(instance.id)) continue;
        const start = dateOnly(instance.start);
        const end = dateOnly(instance.end) || start;
        const timezone = localistZone(feed.timezone, instance.start);
        const entry = record(feed, {
          key: instance.id, title, start, end, sourceUrl, eventType, mode, countryCode, city, description, timezone,
          startTime: timezone && !instance.all_day ? clockTime(instance.start?.split('T')[1]) : '',
          endTime: timezone && !instance.all_day && localistZone(feed.timezone, instance.end) ? clockTime(instance.end?.split('T')[1]) : '',
        });
        if (entry) records.push(entry);
      }
    }
    if (!data.page?.next_page) break;
  }
  return records;
}

async function indico(feed) {
  const pages = await Promise.all(feed.paths.map((path) =>
    getJson(feed.origin, path, { from, to, limit: 100, onlypublic: 'yes' })));
  if (pages.some((page) => !Array.isArray(page.results))) throw new Error('Unexpected Indico feed shape');
  const records = [];
  for (const event of pages.flatMap(({ results }) => results)) {
    if (!/^\d+$/.test(event.id)) continue;
    const start = dateOnly(event.startDate?.date);
    const end = dateOnly(event.endDate?.date) || start;
    const title = text(event.title);
    // Copy only normalized metadata. The organizer description can contain joining details.
    const [countryCode, city] = indicoLocation(event);
    const description = descriptionText(event.description);
    const timezone = zone(event.timezone);
    // The public ATS seminar page confirms both a conference room and remote attendance.
    const mode = String(event.id) === '1755487' ? 'hybrid' : indicoMode(title, description, countryCode);
    const entry = record(feed, {
      key: event.id, start, end, title, sourceUrl: eventLink(feed.origin, event.url),
      eventType: kindOf(title, ''),
      mode, countryCode, city, timezone, description,
      // The category export can express wall-clock times in a different zone than the host.
      startTime: timezone && zone(event.startDate?.tz) === timezone ? clockTime(event.startDate?.time) : '',
      endTime: timezone && zone(event.endDate?.tz) === timezone ? clockTime(event.endDate?.time) : '',
    });
    if (entry) records.push(entry);
  }
  return records;
}

async function readArray(path, optional = false) {
  try {
    const data = JSON.parse(await readFile(path, 'utf8'));
    if (!Array.isArray(data)) throw new Error(`${path.pathname} must contain an array.`);
    return data;
  } catch (error) {
    if (optional && error.code === 'ENOENT') return [];
    throw error;
  }
}

const [previousSnapshot, archiveYears] = await Promise.all([
  readArray(output, true), readArray(archiveIndex, true),
]);
if (!archiveYears.every(year => typeof year === 'string' && /^\d{4}$/.test(year)) ||
    new Set(archiveYears).size !== archiveYears.length) {
  throw new Error('The event archive index must contain unique four-digit years.');
}
const archives = new Map(await Promise.all(archiveYears.map(async year => [
  year, new Map((await readArray(archiveFile(year))).map(entry => [entry.id, entry])),
])));
const activeFeeds = feeds.filter(feed => feed.automatic !== false);
const referencePrefixes = feeds.filter(feed => feed.automatic === false).map(feed => 'directory-' + feed.key + '-');
const previous = previousSnapshot.filter(event => !referencePrefixes.some(prefix => event.id.startsWith(prefix)));
const [results, rss] = await Promise.all([
  Promise.allSettled(activeFeeds.map((feed) => feed.paths ? indico(feed) : localist(feed))),
  fetchOrganizerRss({ from, to }),
]);
if (results.every(({ status }) => status === 'rejected') && !rss.successfulSources.length) {
  for (const { reason } of results) console.error(reason.message);
  for (const { name, error } of rss.failedSources) console.error(name + ': ' + error.message);
  throw new Error('All organizer feeds failed. The existing snapshot was preserved.');
}
const keepUpcoming = key => previous.filter(event =>
  event.id.startsWith('directory-' + key + '-') && event.endDate >= from && event.startDate < to);
const records = results.flatMap((result, i) => {
  const { name, key } = activeFeeds[i];
  if (result.status === 'fulfilled') {
    console.log(name + ': ' + result.value.length + ' candidate listings');
    return result.value;
  }
  console.warn(name + ': ' + result.reason.message + '. Keeping still-upcoming listings from the previous snapshot.');
  return keepUpcoming(key);
});
for (const { name, count } of rss.successfulSources) console.log(name + ': ' + count + ' RSS listings');
for (const { id, name, error } of rss.failedSources) {
  console.warn(name + ': ' + error.message + '. Keeping still-upcoming listings from the previous snapshot.');
  records.push(...keepUpcoming(id));
}
records.push(...rss.records);
const currentIds = new Set(records.map(entry => entry.id));
// Keep listings through the day they end even if an organizer has already removed them.
records.push(...previous.filter(entry => entry.endDate <= from &&
  !currentIds.has(entry.id)));

function order(a, b) {
  return a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, 'en') ||
    a.sourceUrl.localeCompare(b.sourceUrl) || a.id.localeCompare(b.id);
}

const previousById = new Map();
for (const [, archive] of [...archives].sort(([a], [b]) => a.localeCompare(b))) {
  for (const [id, entry] of archive) previousById.set(id, entry);
}
for (const entry of previous) previousById.set(entry.id, entry);
const snapshot = [...new Map(records.sort(order).map((entry) => [
  entry.sourceUrl + '|' + entry.startDate, entry,
])).values()].map((entry) => {
  const prior = previousById.get(entry.id);
  const subjectCodes = prior?.title === entry.title && Array.isArray(prior.subjectCodes) && prior.subjectCodes.length
    ? prior.subjectCodes
    : organizerEventSubjectCodes(entry);
  return subjectCodes.length ? { ...entry, subjectCodes } : entry;
}).sort(order);

const current = [];
const changedYears = new Set();
for (const entry of snapshot) {
  // Keep just-ended listings in both files for one day while the CDN updates them.
  const inOverlap = entry.endDate >= overlapFrom;
  if (inOverlap) current.push(entry);
  if (entry.endDate >= from) continue;
  const year = entry.endDate.slice(0, 4);
  if (!archives.has(year)) archives.set(year, new Map());
  const archive = archives.get(year);
  // After a missed refresh, keep the first published copy in both files as well.
  if (!inOverlap && !archive.has(entry.id)) current.push(entry);
  archive.set(entry.id, entry);
  changedYears.add(year);
}

async function writeSnapshot(path, data) {
  const temporary = new URL('./.events-snapshot-' + randomUUID() + '.json', path);
  try {
    await writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

// Make each archive available before removing its records from the current snapshot.
for (const year of changedYears) {
  await writeSnapshot(archiveFile(year), [...archives.get(year).values()].sort(order));
}
await writeSnapshot(archiveIndex, [...archives.keys()].sort().reverse());
await writeSnapshot(output, current);
const archiveCount = [...archives.values()].reduce((count, archive) => count + archive.size, 0);
console.log(`Wrote ${current.length} current and kept ${archiveCount} archived organizer listings.`);
