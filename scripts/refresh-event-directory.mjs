import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';

const output = new URL('../dist/data/events-feed.json', import.meta.url);
const defaultFrom = new Date().toISOString().slice(0, 10);
const from = process.argv.find((arg) => arg.startsWith('--from='))?.slice(7) ?? defaultFrom;
const parsedFrom = new Date(from);
if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !Number.isFinite(parsedFrom.valueOf()) ||
    parsedFrom.toISOString().slice(0, 10) !== from) {
  throw new Error('Use --from=YYYY-MM-DD with a valid calendar date.');
}

const days = 120;
const to = new Date(parsedFrom.valueOf() + days * 86_400_000).toISOString().slice(0, 10);
const countries = new Intl.DisplayNames(['en'], { type: 'region' });
const countryData = JSON.parse(await readFile(new URL('../dist/data/countries.json', import.meta.url), 'utf8'));
const explicitCountries = new Map(countryData.flatMap(({ iso, name }) => [
  [name.toLowerCase(), iso], [countries.of(iso).toLowerCase(), iso],
]));
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
    eventTypes: ['37952570025304', '37952570027353', '37952570047842'],
    audience: ['General Public', 'Everyone'],
  },
  {
    key: 'mit', name: 'Massachusetts Institute of Technology', origin: 'https://calendar.mit.edu',
    eventTypes: ['102764', '103222'], audience: ['Public'],
  },
  {
    key: 'cern', name: 'CERN Indico', origin: 'https://indico.cern.ch',
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

function record(feed, { key, title, start, end, sourceUrl, eventType, countryCode, city, mode }) {
  if (!title || !sourceUrl || !eventType || !start || !end || start < from || start >= to || end < start ||
      /\b(?:cancel(?:l)?ed|postponed|template|test event)\b/i.test(title)) return null;
  const entry = {
    id: 'directory-' + feed.key + '-' + key, type: 'event', eventType, title,
    description: 'See the organizer’s event page for the program and participation details.',
    institution: feed.name, startDate: start, endDate: end, sourceUrl, directory: true,
  };
  if (/^[A-Z]{2}$/.test(countryCode)) {
    entry.countryCode = countryCode;
    entry.country = countries.of(countryCode);
  }
  if (city) entry.city = city;
  if (mode) entry.mode = mode;
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
      for (const { event_instance: instance } of event.event_instances ?? []) {
        if (!instance || !Number.isSafeInteger(instance.id)) continue;
        const start = dateOnly(instance.start);
        const end = dateOnly(instance.end) || start;
        const entry = record(feed, {
          key: instance.id, title, start, end, sourceUrl, eventType, mode,
          countryCode: text(event.geo?.country, 2).toUpperCase(), city: text(event.geo?.city, 80),
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
    // Free-text venue and description fields may contain meeting credentials;
    // do not store them. Only assign a location when indicated by the source.
    const place = text(event.location, 120).split(',').map((part) => part.trim());
    const countryCode = explicitCountries.get(place.at(-1)?.toLowerCase()) || '';
    const city = countryCode && place.length === 2 && /^[\p{L}\p{M} .'-]+$/u.test(place[0])
      ? place[0]
      : '';
    const entry = record(feed, {
      key: event.id, start, end, title, sourceUrl: eventLink(feed.origin, event.url),
      eventType: kindOf(title, ''),
      mode: /\b(?:online|virtual|webinar)\b/i.test(title) ? 'online' : undefined,
      countryCode, city,
    });
    if (entry) records.push(entry);
  }
  return records;
}

let previous = [];
try {
  previous = JSON.parse(await readFile(output, 'utf8'));
  if (!Array.isArray(previous)) throw new Error('The existing feed snapshot must be an array.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const results = await Promise.allSettled(feeds.map((feed) => feed.paths ? indico(feed) : localist(feed)));
if (results.every(({ status }) => status === 'rejected')) {
  for (const { reason } of results) console.error(reason.message);
  throw new Error('All organizer feeds failed. The existing snapshot was preserved.');
}
const records = results.flatMap((result, i) => {
  const { name, key } = feeds[i];
  if (result.status === 'fulfilled') {
    console.log(name + ': ' + result.value.length + ' candidate listings');
    return result.value;
  }
  console.warn(name + ': ' + result.reason.message + '. Keeping still-upcoming listings from the previous snapshot.');
  return previous.filter((event) =>
    event.id.startsWith('directory-' + key + '-') && event.startDate >= from && event.startDate < to);
});

function order(a, b) {
  return a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, 'en') ||
    a.sourceUrl.localeCompare(b.sourceUrl) || a.id.localeCompare(b.id);
}

const snapshot = [...new Map(records.sort(order).map((entry) => [
  entry.sourceUrl + '|' + entry.startDate, entry,
])).values()].sort(order);
const temporary = new URL('./.events-feed-' + randomUUID() + '.json', output);
try {
  await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n');
  await rename(temporary, output);
} finally {
  await rm(temporary, { force: true });
}
console.log('Wrote ' + snapshot.length + ' filtered listings to dist/data/events-feed.json.');
