const snapshotUrl = 'https://raw.githubusercontent.com/drdixitrajesh/open-research-commons/main/dist/data/events-feed.json';
const maxSnapshotBytes = 2 * 1024 * 1024;
let cached;
let refreshAfter = 0;

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

async function readSnapshot() {
  const response = await fetch(snapshotUrl, {
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
      if (bytes > maxSnapshotBytes) throw new Error('Organizer snapshot too large');
      body += decoder.decode(value, { stream: true });
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const events = JSON.parse(body + decoder.decode());
  if (!Array.isArray(events) || !events.every(validEntry)) throw new Error('Invalid organizer snapshot');
  // A CDN may still serve a snapshot from before CERN switched to reference links.
  return events.filter(entry => !entry.id.startsWith('directory-cern-'));
}

export async function loadOrganizerSnapshot(fallback) {
  if (Date.now() >= refreshAfter) {
    try {
      cached = await readSnapshot();
      refreshAfter = Date.now() + 5 * 60_000;
    } catch {
      refreshAfter = Math.max(refreshAfter, Date.now() + 60_000);
    }
  }
  return cached ?? fallback;
}
