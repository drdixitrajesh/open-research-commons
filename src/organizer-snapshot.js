const snapshotBase = 'https://raw.githubusercontent.com/drdixitrajesh/open-research-commons/main/dist/data/';
const maxSnapshotBytes = 8 * 1024 * 1024;
const cachedFiles = new Map();

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().startsWith(value);
}

function validEntry(entry) {
  if (entry?.type !== 'event' || entry.directory !== true || typeof entry.id !== 'string' ||
      !entry.id.startsWith('directory-') || typeof entry.title !== 'string' || !entry.title ||
      !validDate(entry.startDate) || !validDate(entry.endDate) || entry.endDate < entry.startDate ||
      typeof entry.sourceUrl !== 'string' || !URL.canParse(entry.sourceUrl)) return false;
  if (entry.subjectCodes !== undefined && (!Array.isArray(entry.subjectCodes) ||
      entry.subjectCodes.some(code => typeof code !== 'string' || !/^(?:\d{2}){1,3}$/.test(code)))) return false;
  const source = new URL(entry.sourceUrl);
  return source.protocol === 'https:' && !source.username && !source.password;
}

async function readJson(path, maxBytes) {
  const response = await fetch(new URL(path, snapshotBase), {
    redirect: 'error',
    signal: AbortSignal.timeout(3500),
  });
  if (!response.ok || !response.body) throw new Error('Organizer snapshot unavailable');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let body = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('Organizer snapshot too large');
      body += decoder.decode(value, { stream: true });
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(body + decoder.decode());
}

async function readEvents(path, year) {
  const events = await readJson(path, maxSnapshotBytes);
  if (!Array.isArray(events) || !events.every(validEntry)) throw new Error('Invalid organizer snapshot');
  if (year && events.some(event => !event.endDate.startsWith(year + '-'))) throw new Error('Invalid organizer archive year');
  // A CDN may still serve a snapshot from before CERN switched to reference links.
  return events.filter(entry => !entry.id.startsWith('directory-cern-'));
}

async function readArchiveIndex(path) {
  const years = await readJson(path, 128 * 1024);
  if (!Array.isArray(years) || !years.every(year => typeof year === 'string' && /^\d{4}$/.test(year)) ||
      years.length !== new Set(years).size) throw new Error('Invalid organizer archive index');
  return years;
}

async function loadFile(path, read, fallback) {
  const cached = cachedFiles.get(path);
  if (cached && Date.now() < cached.refreshAfter) return cached.value ?? fallback;
  try {
    const value = await read(path);
    cachedFiles.set(path, { value, refreshAfter: Date.now() + 5 * 60_000 });
    return value;
  } catch {
    const value = cachedFiles.get(path)?.value;
    cachedFiles.set(path, { value, refreshAfter: Date.now() + 60_000 });
    return value ?? fallback;
  }
}

export function mergeOrganizerEvents(snapshots) {
  const events = new Map();
  for (const snapshot of snapshots) {
    for (const event of snapshot) events.set(event.id, event);
  }
  return [...events.values()];
}

export async function loadOrganizerSnapshot({ current, archives }, { includeArchive = true } = {}) {
  const currentRequest = loadFile('events-feed.json', readEvents, current);
  if (!includeArchive) return currentRequest;

  const bundledYears = [...archives.keys()];
  const hostedYears = await loadFile('events-archive-index.json', readArchiveIndex, bundledYears);
  const years = [...new Set([...bundledYears, ...hostedYears])].sort();
  const past = await Promise.all(years.map(async year => {
    const remote = await loadFile(`events-archive-${year}.json`, path => readEvents(path, year), []);
    return mergeOrganizerEvents([archives.get(year) ?? [], remote]);
  }));
  return mergeOrganizerEvents([...past, await currentRequest]);
}
