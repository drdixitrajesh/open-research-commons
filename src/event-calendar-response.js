import {calendarFile, eventSchedule} from '../dist/event-calendar.js';

const site = 'https://conference.softinator.org/';
const calendarPath = /^\/calendar\/([a-z0-9_-]{1,160})\.ics$/i;
const metadataCode = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const responseHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export function calendarRecordId(pathname) {
  const match = typeof pathname === 'string' ? calendarPath.exec(pathname) : null;
  return match && match[0] === pathname ? match[1] : null;
}

function publicEvent(record) {
  if (record?.type !== 'event') return false;
  return record.status === 'published' ||
    (record.directory === true && !record.status) ||
    (record.example === true && (!record.status || record.status === 'example'));
}

function publicTitle(record, requestedLanguage) {
  if (requestedLanguage && requestedLanguage.length <= 63 &&
      metadataCode.test(requestedLanguage) && record.metadata &&
      Object.hasOwn(record.metadata, requestedLanguage)) {
    const translation = record.metadata[requestedLanguage]?.title;
    if (typeof translation === 'string' && translation.trim()) return translation.trim();
  }
  return typeof record.title === 'string' ? record.title.trim() : '';
}

function organizerLink(record) {
  return [record.sourceUrl, record.externalUrl, record.registrationUrl].find(candidate => {
    if (typeof candidate !== 'string' || /[\u0000-\u001f\u007f-\u009f]/.test(candidate)) return false;
    try {
      const link = new URL(candidate);
      return (link.protocol === 'https:' || link.protocol === 'http:') && !link.username && !link.password;
    } catch {
      return false;
    }
  });
}

export function eventCalendarResponse(request, record) {
  const head = request.method === 'HEAD';
  if (!head && request.method !== 'GET') {
    return new Response(null, {status:405, headers:{...responseHeaders, Allow:'GET, HEAD'}});
  }
  const requestedUrl = new URL(request.url);
  const id = calendarRecordId(requestedUrl.pathname);
  const schedule = id && record?.id === id && publicEvent(record) ? eventSchedule(record) : null;
  const title = schedule ? publicTitle(record, requestedUrl.searchParams.get('metadata')) : '';
  if (!schedule || !title) {
    return new Response(head ? null : 'Event calendar not found.', {
      status:404, headers:{...responseHeaders, 'Content-Type':'text/plain; charset=utf-8'},
    });
  }

  const url = new URL(site);
  url.searchParams.set('record', id);
  const location = [...new Set([record.venue, record.city, record.country]
    .filter(value => typeof value === 'string').map(value => value.trim()).filter(Boolean))].join(', ');
  const body = head ? null : calendarFile(schedule, {
    title, id, url:url.href, sourceUrl:organizerLink(record), location,
  });
  return new Response(body, {headers:{
    ...responseHeaders,
    'Content-Type':'text/calendar; charset=utf-8',
    'Content-Disposition':'attachment; filename="event-' + id + '.ics"',
  }});
}
