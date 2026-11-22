export const notSpecified = '_unspecified';
export const eventPeriods = ['upcoming', 'ongoing', 'past', 'deadlines'];
export const eventFacets = ['kind', 'subject', 'country', 'el', 'ml', 'mode', 'toa', 'seo'];
const dateFields = ['from', 'to'];
const filterFields = [...eventFacets, ...dateFields];
const inactiveStatuses = ['cancelled', 'postponed'];
const isoDay = value => value?.slice(0, 10) || '';

export function eventDateAt(timezone, now = new Date()) {
  if (!timezone || timezone === 'UTC') return now.toISOString().slice(0, 10);
  try {
    const format = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = Object.fromEntries(format.formatToParts(now).map(part => [part.type, part.value]));
    return parts.year + '-' + parts.month + '-' + parts.day;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function eventPeriod(record, today) {
  const start = isoDay(record.startDate);
  const end = isoDay(record.endDate) || start;
  if (record.eventStatus === 'held' || (end && end < today)) return 'past';
  if (!start || inactiveStatuses.includes(record.eventStatus)) return '';
  return start <= today ? 'ongoing' : 'upcoming';
}

export const callDeadline = record => record.deadline || record.paperDeadline || '';

function facetValues(values) {
  const keys = [...new Set(values.filter(Boolean))];
  return keys.length ? keys : [notSpecified];
}

function canonicalLanguage(value) {
  if (!value) return '';
  try { return Intl.getCanonicalLocales(value)[0] || ''; }
  catch { return ''; }
}

export function languageSelection(value) {
  return canonicalLanguage(value) || value || '';
}

export function recordLanguageTags(record, facet) {
  if (facet === 'ml') return [record.metadataLanguage || record.language, ...Object.keys(record.metadata || {})];
  if (record.type === 'event' && facet === 'el') {
    const additional = Array.isArray(record.languages) ? record.languages : [];
    return [record.language, ...additional];
  }
  return record.type !== 'event' && facet === 'dl' ? [record.language] : [];
}

export function languageKeys(values) {
  const tags = values.map(canonicalLanguage).filter(Boolean);
  return [...new Set(tags.flatMap(tag => [tag, tag.split('-')[0]]))];
}

export function matchesLanguage(record, facet, selected) {
  return !selected || facetValues(languageKeys(recordLanguageTags(record, facet))).includes(languageSelection(selected));
}

export function indexEvents(records, countryCode, now = new Date()) {
  const daysByZone = new Map();
  return records.map(record => {
    const zone = record.timezone || 'UTC';
    if (!daysByZone.has(zone)) daysByZone.set(zone, eventDateAt(zone, now));
    const today = daysByZone.get(zone);
    const start = isoDay(record.startDate);
    const opens = isoDay(record.callOpens);
    const deadline = isoDay(callDeadline(record));
    const period = eventPeriod(record, today);
    const prefixes = code => {
      const values = [];
      for (let length = 2; length <= code.length; length += 2) values.push(code.slice(0, length));
      return values;
    };
    return {
      record, period, start, end: isoDay(record.endDate) || start,
      openCall: record.callForPapers !== false && period !== 'past' && !inactiveStatuses.includes(record.eventStatus)
        && opens <= today && deadline >= today,
      values: {
        kind: facetValues([record.eventType]),
        subject: facetValues((record.subjectCodes || []).flatMap(prefixes)),
        toa: facetValues([record.activityType]),
        seo: facetValues((record.objectives || []).flatMap(prefixes)),
        country: facetValues([countryCode(record)]),
        el: facetValues(languageKeys(recordLanguageTags(record, 'el'))),
        ml: facetValues(languageKeys(recordLanguageTags(record, 'ml'))),
        mode: facetValues([record.mode]),
      },
    };
  });
}

export function countEvents(index, filters, period) {
  const selected = Object.fromEntries(filterFields.map(name => [name, filters.get(name) || '']));
  selected.el = languageSelection(selected.el);
  selected.ml = languageSelection(selected.ml);
  const counts = Object.fromEntries(eventFacets.map(name => [name, new Map()]));
  const dates = {from: 0, to: 0};
  const periods = Object.fromEntries(eventPeriods.map(name => [name, 0]));
  const matches = [];
  const tally = (name, keys) => {
    for (const key of ['', ...keys]) counts[name].set(key, (counts[name].get(key) || 0) + 1);
  };

  for (const row of index) {
    const fromMatches = !selected.from || (row.end && row.end >= selected.from);
    const toMatches = !selected.to || (row.start && row.start <= selected.to);
    const missed = eventFacets.filter(name => selected[name] && !row.values[name].includes(selected[name]));
    const allMatch = !missed.length && fromMatches && toMatches;
    if (allMatch) {
      if (row.period) periods[row.period]++;
      if (row.openCall) periods.deadlines++;
    }
    if (period === 'deadlines' ? !row.openCall : period && row.period !== period) continue;

    if (!missed.length) {
      if (fromMatches) dates.from++;
      if (toMatches) dates.to++;
    }
    if (!fromMatches || !toMatches) continue;
    if (!missed.length) {
      matches.push(row.record);
      for (const name of eventFacets) tally(name, row.values[name]);
    } else if (missed.length === 1) {
      const [name] = missed;
      tally(name, row.values[name]);
    }
  }
  return {matches, counts, dates, periods};
}
