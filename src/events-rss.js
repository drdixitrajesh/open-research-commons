import { eventDateAt, eventPeriod } from '../dist/event-filters.js';

const origin = 'https://conference.softinator.org';
const feedUrl = origin + '/events.rss';
const catalogUrl = origin + '/?view=events';
const maxItems = 200;
const dayMilliseconds = 86_400_000;
const entities = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'};
const invalidXml = /[^\t\n\r\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;
const xml = value => String(value ?? '').replace(invalidXml, '').replace(/[&<>"']/g, character => entities[character]);

function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().startsWith(value) ? value : '';
}

function sourceLink(record) {
  try {
    const url = new URL(record.sourceUrl);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url;
  } catch {}
  return null;
}

function sourceKey(record) {
  const url = sourceLink(record);
  return url ? url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/+$/, '') : '';
}

function visibleEvents(directoryRecords, publishedRecords, now) {
  const seen = new Set();
  const ids = new Set();
  const todayByZone = new Map();
  const events = [];
  const published = publishedRecords.filter(record => record?.status === 'published');
  const directory = directoryRecords.filter(record => record?.directory === true &&
    typeof record.id === 'string' && record.id.startsWith('directory-') && sourceKey(record));
  for (const record of [...published, ...directory]) {
    if (record.type !== 'event' || record.example || !record.id || !record.title || !day(record.startDate)) continue;
    const zone = record.timezone || 'UTC';
    if (!todayByZone.has(zone)) todayByZone.set(zone, eventDateAt(zone, now));
    const period = eventPeriod(record, todayByZone.get(zone));
    if (period !== 'upcoming' && period !== 'ongoing') continue;
    const name = String(record.title).trim().toLowerCase();
    const identity = (sourceKey(record) || name) + ' ' + record.startDate;
    if (seen.has(identity) || ids.has(record.id)) continue;
    seen.add(identity);
    ids.add(record.id);
    events.push(record);
  }
  return events.sort((a, b) => a.startDate.localeCompare(b.startDate) ||
    String(a.title).localeCompare(String(b.title)) || String(a.id).localeCompare(String(b.id))).slice(0, maxItems);
}

function feedItem(record) {
  const link = new URL('/', origin);
  link.searchParams.set('record', record.id);
  const end = day(record.endDate);
  const dates = end && end !== record.startDate ? record.startDate + ' – ' + end : record.startDate;
  const summary = [dates, record.institution, record.description].filter(Boolean).join(' · ');
  const source = sourceLink(record);
  const sourceHtml = source ? '<br><a href="' + xml(source.href) + '">' +
    (record.directory ? 'Official organizer page' : 'Source page') + '</a>' : '';
  const published = new Date(record.publishedAt || '');
  const pubDate = Number.isFinite(published.valueOf()) ? '<pubDate>' + published.toUTCString() + '</pubDate>' : '';
  // RSS readers may treat descriptions as HTML. Encode the plain text for both layers.
  return [
    '<item>', '<title>' + xml(record.title) + '</title>', '<link>' + xml(link.href) + '</link>',
    '<guid isPermaLink="true">' + xml(link.href) + '</guid>', pubDate,
    '<description>' + xml(xml(summary) + sourceHtml) + '</description>', '</item>'
  ].filter(Boolean).join('\n');
}

export function eventsRssResponse(request, directoryRecords, publishedRecords = [], now = new Date()) {
  const headers = {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff'
  };
  if (request.method === 'HEAD') return new Response(null, { headers });
  const items = visibleEvents(directoryRecords, publishedRecords, now);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    '<title>Global Conference &amp; Research Repository – Events</title>',
    '<link>' + xml(catalogUrl) + '</link>',
    '<description>Upcoming and ongoing conferences, seminars, symposia, workshops, and webinars.</description>',
    '<atom:link href="' + xml(feedUrl) + '" rel="self" type="application/rss+xml" />',
    ...items.map(feedItem),
    '</channel></rss>'
  ].join('\n');
  return new Response(body, { headers });
}

export async function readPublishedEvents(db, now = new Date()) {
  if (!db) return [];
  // A listing can remain current in the organizer's timezone after UTC midnight.
  const earliest = new Date(now.valueOf() - dayMilliseconds).toISOString().slice(0, 10);
  const { results } = await db.prepare(`
    SELECT id, published_at AS publishedAt, 'published' AS status, 'event' AS type,
      json_extract(record_json, '$.title') AS title,
      json_extract(record_json, '$.description') AS description,
      json_extract(record_json, '$.institution') AS institution,
      json_extract(record_json, '$.startDate') AS startDate,
      json_extract(record_json, '$.endDate') AS endDate,
      json_extract(record_json, '$.timezone') AS timezone,
      json_extract(record_json, '$.eventStatus') AS eventStatus,
      json_extract(record_json, '$.sourceUrl') AS sourceUrl
    FROM submissions
    WHERE status = 'published' AND json_extract(record_json, '$.type') = 'event'
      AND COALESCE(NULLIF(json_extract(record_json, '$.endDate'), ''), json_extract(record_json, '$.startDate')) >= ?
    ORDER BY startDate, id
    LIMIT 400
  `).bind(earliest).all();
  return results;
}
