const unavailableStatuses = new Set(['withdrawn', 'cancelled', 'canceled', 'postponed', 'publication_pending']);
const ambiguousZones = new Set(['AST','ADT','CST','CDT','EST','EDT','MST','MDT','PST','PDT','HST','BST','IST']);
const hour = 60 * 60 * 1000;
const dateText = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const timeText = /^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
const hasValue = value => value != null && value !== '';

function validDate(value) {
  if (typeof value !== 'string' || !dateText.test(value) || value.startsWith('0000')) return false;
  const day = new Date(value);
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === value;
}

function clockInZone(timeZone) {
  // Short abbreviations such as CST can refer to several time zones.
  const zone = typeof timeZone === 'string' ? timeZone.trim() : '';
  if (!zone || ambiguousZones.has(zone.toUpperCase())) return null;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, calendar: 'gregory', numberingSystem: 'latn', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return null;
  }
}

function wallClock(formatter, instant) {
  const parts = Object.fromEntries(formatter.formatToParts(instant).map(({type, value}) => [type, value]));
  const date = parts.year.padStart(4, '0') + '-' + parts.month + '-' + parts.day;
  return Date.parse(date + 'T' + parts.hour + ':' + parts.minute + ':' + parts.second + 'Z');
}

function instantInZone(date, time, formatter) {
  if (!date || !formatter || typeof time !== 'string' || ![5, 8].includes(time.length) || !timeText.test(time)) return null;
  const desired = Date.parse(date + 'T' + (time.length === 5 ? time + ':00' : time) + 'Z');
  // Sample across both sides of a nearby offset change, then round-trip each possibility.
  const offsets = new Set([-36, -24, -12, 0, 12, 24, 36].map(hours => {
    const probe = desired + hours * hour;
    return wallClock(formatter, probe) - probe;
  }));
  const candidates = [...offsets].filter(Number.isFinite).map(offset => desired - offset)
    .filter(instant => wallClock(formatter, instant) === desired);
  return candidates.length === 1 ? new Date(candidates[0]) : null;
}

export function eventSchedule(record) {
  if (!record || (record.type && record.type !== 'event') ||
      [record.status, record.eventStatus].some(status => unavailableStatuses.has(String(status || '').trim().toLowerCase())) ||
      !validDate(record.startDate)) return null;
  const startDate = record.startDate;
  const endDate = hasValue(record.endDate) ? record.endDate : null;
  if (endDate !== null && (!validDate(endDate) || endDate < startDate)) return null;

  const formatter = record.startTime || record.endTime ? clockInZone(record.timezone) : null;
  const start = instantInZone(startDate, record.startTime, formatter);
  const end = instantInZone(endDate, record.endTime, formatter);
  return {startDate, endDate, start, end: start && end && end <= start ? null : end};
}

const cleanText = value => String(value ?? '')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '')
  .replace(/\\/g, '\\\\')
  .replace(/\r\n?|\n|\u2028|\u2029/g, '\\n')
  .replace(/[,;]/g, '\\$&');

function publicUrl(value) {
  if (typeof value !== 'string' || /[\x00-\x1f\x7f-\x9f]/.test(value)) return '';
  try {
    const parsed = new URL(value);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : '';
  } catch {
    return '';
  }
}

const encoder = new TextEncoder();
function foldLine(line) {
  let folded = '';
  let length = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) {
      folded += '\r\n ';
      length = 1;
    }
    folded += character;
    length += bytes;
  }
  return folded;
}

const compactDate = value => value.replaceAll('-', '');
const compactTime = instant => Date.prototype.toISOString.call(instant).replace(/[-:]|\.[0-9]{3}/g, '');
function nextDate(value) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + 1);
  const iso = next.toISOString();
  return iso.startsWith('+') ? '' : iso.slice(0, 10);
}

export function calendarFile(schedule, {title, id, url, sourceUrl, location}, now = new Date()) {
  if (!validDate(schedule?.startDate) || (hasValue(schedule.endDate) &&
      (!validDate(schedule.endDate) || schedule.endDate < schedule.startDate))) {
    throw new TypeError('A valid event schedule is required.');
  }
  const recordUrl = publicUrl(url);
  const organizerUrl = publicUrl(sourceUrl);
  const uid = cleanText(id || recordUrl || organizerUrl || [schedule.startDate, title].join('-'));
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Global Conference and Research Repository//Events//EN',
    'BEGIN:VEVENT', 'UID:' + uid + '@conference.softinator.org',
    'DTSTAMP:' + compactTime(now), 'SUMMARY:' + cleanText(title),
  ];

  if (schedule.start) {
    lines.push('DTSTART:' + compactTime(schedule.start));
    if (schedule.end && schedule.end > schedule.start) lines.push('DTEND:' + compactTime(schedule.end));
  } else {
    lines.push('DTSTART;VALUE=DATE:' + compactDate(schedule.startDate));
    const exclusiveEnd = schedule.endDate && nextDate(schedule.endDate);
    if (exclusiveEnd) lines.push('DTEND;VALUE=DATE:' + compactDate(exclusiveEnd));
  }

  if (location) lines.push('LOCATION:' + cleanText(location));
  if (recordUrl || organizerUrl) lines.push('URL:' + (recordUrl || organizerUrl));
  if (recordUrl && organizerUrl && organizerUrl !== recordUrl) lines.push('DESCRIPTION:' + cleanText(organizerUrl));
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
