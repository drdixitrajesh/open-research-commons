import { calendarRecordId } from '../src/event-calendar-response.js';

const primaryOrigin = 'https://open-research-commons.softinator.chatgpt.site';
const ownerViews = new Set(['submit', 'account', 'review']);
const authPaths = new Set([
  '/signin-with-chatgpt', '/signup-with-chatgpt', '/signout-with-chatgpt',
  '/signin', '/signup', '/signout',
]);
const idPattern = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}';
const detailPath = new RegExp('^/api/(records|files)/' + idPattern + '$', 'i');
const readHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function json(request, data, status = 200, headers = {}) {
  const init = { status, headers: { ...readHeaders, 'Content-Type': 'application/json; charset=utf-8', ...headers } };
  return new Response(request.method === 'HEAD' ? null : JSON.stringify(data), init);
}

function primaryURL(source) {
  const destination = new URL(primaryOrigin);
  destination.pathname = source.pathname;
  destination.search = source.search;
  return destination;
}

function methodDenied(request) {
  return json(request, { error: 'This mirror is read-only.' }, 405, { Allow: 'GET, HEAD' });
}

function safeReturn(value) {
  const path = value.split(/[?#]/u, 1)[0];
  if (!value.startsWith('/') || /[\u0000-\u001f\u007f\\]/u.test(value) || value.startsWith('//') ||
      /%(?:25)*(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/iu.test(path)) return false;
  try { return new URL(value, primaryOrigin).origin === primaryOrigin; }
  catch { return false; }
}

function notVisible(request, isCatalog) {
  if (isCatalog) return json(request, { records: [], next: null });
  return json(request, { error: 'This record or file could not be found.' }, 404);
}

async function proxyPublic(request, url, isCatalog, isFile) {
  let remote;
  try {
    remote = await fetch(primaryURL(url), {
      // Records are served as GET by the primary API, including mirror HEAD requests.
      method: isFile ? request.method : 'GET',
      headers: { Accept: isFile ? '*/*' : 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return json(request, { error: 'The repository service is unavailable.' }, 502);
  }

  const block = () => {
    remote.body?.cancel().catch(() => {});
    return notVisible(request, isCatalog);
  };
  if ([401, 403].includes(remote.status) || (remote.status >= 300 && remote.status < 400)) return block();

  const contentType = remote.headers.get('Content-Type') || '';
  const isJson = /^application\/json(?:\s*;|$)/i.test(contentType);
  if (remote.ok && isFile) {
    const disposition = remote.headers.get('Content-Disposition');
    if (!disposition || !/^attachment(?:\s*;|$)/i.test(disposition) || /^text\/html\b/i.test(contentType)) return block();
    const headers = {
      ...readHeaders,
      'Content-Disposition': disposition,
      'Content-Type': contentType || 'application/octet-stream',
    };
    const length = remote.headers.get('Content-Length');
    if (length && /^\d+$/.test(length)) headers['Content-Length'] = length;
    return new Response(request.method === 'HEAD' ? null : remote.body, { status: remote.status, headers });
  }
  if (!isJson) {
    if (remote.status >= 500) {
      remote.body?.cancel().catch(() => {});
      return json(request, { error: 'The repository service is unavailable.' }, 502);
    }
    // The private primary site's sign-in page is not a catalog response.
    return block();
  }
  if (request.method === 'HEAD') remote.body?.cancel().catch(() => {});
  return new Response(request.method === 'HEAD' ? null : remote.body, {
    status: remote.status,
    headers: { ...readHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function cloudflareResponse(request) {
  const url = new URL(request.url);
  const authPath = authPaths.has(url.pathname);
  const ownerView = (url.pathname === '/' || url.pathname === '/index.html') && ownerViews.has(url.searchParams.get('view'));
  const readable = request.method === 'GET' || request.method === 'HEAD';
  const participantView = (url.pathname === '/' || url.pathname === '/index.html') && url.searchParams.get('view') === 'participant-registration';
  if (url.pathname.startsWith('/event-sites/') || participantView) {
    if (!readable) return methodDenied(request);
    const publishedSite = new URL('https://conference.softinator.org');
    publishedSite.pathname = url.pathname;
    publishedSite.search = url.search;
    return new Response(null, { status:302, headers:{...readHeaders, Location:publishedSite.href} });
  }
  if (authPath || ownerView) {
    if (!readable) return methodDenied(request);
    if (authPath && (url.searchParams.getAll('return_to').length > 1 ||
        [...url.searchParams].some(([key, value]) => key !== 'return_to' || !safeReturn(value)))) {
      return json(request, { error: 'This return address is invalid.' }, 400);
    }
    return new Response(null, {
      status: 302,
      headers: { ...readHeaders, Location: primaryURL(url).href },
    });
  }

  if (calendarRecordId(url.pathname)) {
    return readable ? proxyPublic(request, url, false, true) : methodDenied(request);
  }
  if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) return null;
  const isCatalog = url.pathname === '/api/records';
  const detail = detailPath.exec(url.pathname);
  if (url.pathname === '/api/session') {
    if (!readable) return methodDenied(request);
    return json(request, { user: null, persistent: false, files: false });
  }
  if (!isCatalog && !detail) {
    if (!readable) return methodDenied(request);
    return json(request, { error: 'This endpoint could not be found.' }, 404);
  }
  if (!readable) return methodDenied(request);
  return proxyPublic(request, url, isCatalog, detail?.[1]?.toLowerCase() === 'files');
}
