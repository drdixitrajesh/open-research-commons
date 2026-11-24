import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { messages } from '../dist/i18n.js';

const cloudflare = process.argv.includes('--cloudflare');
const primary = 'https://open-research-commons.softinator.chatgpt.site';
const archiveIndex = '/data/events-archive-index.json';
const archiveYears = JSON.parse(await readFile(new URL('../dist' + archiveIndex, import.meta.url), 'utf8'));
const jsonMime = 'application/json; charset=utf-8';
const assets = new Map([
  ['/index.html','text/html; charset=utf-8'], ['/styles.css','text/css; charset=utf-8'],
  ['/app.js','text/javascript; charset=utf-8'], ['/workflow.js','text/javascript; charset=utf-8'],
  ['/email-login.js','text/javascript; charset=utf-8'],
  ['/catalog-search.js','text/javascript; charset=utf-8'],
  ['/catalog-subjects.js','text/javascript; charset=utf-8'],
  ['/event-planner.js','text/javascript; charset=utf-8'], ['/event-planner.css','text/css; charset=utf-8'],
  ['/planner-classification.js','text/javascript; charset=utf-8'],
  ['/planner-proceedings.js','text/javascript; charset=utf-8'], ['/planner-proceedings.css','text/css; charset=utf-8'],
  ['/planner-website.js','text/javascript; charset=utf-8'], ['/planner-website.css','text/css; charset=utf-8'],
  ['/planner-registration.js','text/javascript; charset=utf-8'], ['/planner-registration.css','text/css; charset=utf-8'],
  ['/participant-registration.js','text/javascript; charset=utf-8'], ['/participant-registration.css','text/css; charset=utf-8'],
  ['/event-filters.js','text/javascript; charset=utf-8'],
  ['/event-calendar.js','text/javascript; charset=utf-8'],
  ['/i18n.js','text/javascript; charset=utf-8'], ['/examples.js','text/javascript; charset=utf-8'],
  ['/mark.svg','image/svg+xml'], ['/images/field-notes.jpg','image/jpeg'],
  ['/data/subjects.json','application/json; charset=utf-8'], ['/data/subjects-license.txt','text/plain; charset=utf-8'],
  ['/data/anzsrc-classifications.json','application/json; charset=utf-8'],
  ['/data/anzsrc-definitions.json','application/json; charset=utf-8'],
  ['/data/countries.json','application/json; charset=utf-8'], ['/data/countries-license.txt','text/plain; charset=utf-8'],
  ['/data/events-directory.json',jsonMime], ['/data/events-feed.json',jsonMime], [archiveIndex,jsonMime],
  ...archiveYears.map(year => [`/data/events-archive-${year}.json`, jsonMime]),
]);
const entries = await Promise.all([...assets].map(async ([path, mime]) => [
  path, [mime,(await readFile(new URL('../dist' + path,import.meta.url))).toString('base64')]
]));
const clientAssets = entries.filter(([path]) => /\.(js|css|json)$/.test(path));
const clientDigest = createHash('sha256').update(JSON.stringify(clientAssets)).digest('hex').slice(0,16);
// Version the whole module graph together so relative and circular imports share one URL prefix.
const clientPrefix = '/_assets/' + clientDigest;
const source = `
${cloudflare
  ? "import { cloudflareResponse } from './scripts/cloudflare-entry.js';"
  : "import { handleApi } from './src/worker.js';\nimport { publicEventWebsite } from './src/event-website-store.js';\nimport { eventsRssResponse, readPublishedEvents } from './src/events-rss.js';"}
import { loadOrganizerSnapshot } from './src/organizer-snapshot.js';
${cloudflare ? '' : "import { calendarRecordId, eventCalendarResponse } from './src/event-calendar-response.js';\nimport { examples } from './dist/examples.js';"}
const assetMap = new Map(${JSON.stringify(entries)});
const clientPaths = new Set(${JSON.stringify(clientAssets.map(([path]) => path))});
const clientPrefix = ${JSON.stringify(clientPrefix)};
const body = (base64) => Uint8Array.from(atob(base64), char => char.charCodeAt(0));
const decoder = new TextDecoder();
const jsonAsset = (path) => JSON.parse(decoder.decode(body(assetMap.get(path)[1])));
const packagedOrganizerSnapshot = {
  current: jsonAsset('/data/events-feed.json'),
  archives: new Map(${JSON.stringify(archiveYears)}.map(year => [year, jsonAsset('/data/events-archive-' + year + '.json')])),
};
${cloudflare ? '' : "const curatedEvents = JSON.parse(decoder.decode(body(assetMap.get('/data/events-directory.json')[1])));"}
${cloudflare ? '' : "const subjects = new Map(JSON.parse(decoder.decode(body(assetMap.get('/data/subjects.json')[1]))).map(({code,label})=>[code,label]));"}
const siteLanguages = ['en','hi','es','fr','ar','pt','zh','ru'];
const originalPage = decoder.decode(body(assetMap.get('/index.html')[1]))
  .replace('src="/app.js"', 'src="' + clientPrefix + '/app.js"')
  .replace('href="/styles.css"', 'href="' + clientPrefix + '/styles.css"')
  .replace('href="/event-planner.css"', 'href="' + clientPrefix + '/event-planner.css"')
  .replace('href="/planner-proceedings.css"', 'href="' + clientPrefix + '/planner-proceedings.css"')
  .replace('href="/planner-website.css"', 'href="' + clientPrefix + '/planner-website.css"')
  .replace('href="/planner-registration.css"', 'href="' + clientPrefix + '/planner-registration.css"')
  .replace('href="/participant-registration.css"', 'href="' + clientPrefix + '/participant-registration.css"');
const pageEsc = (value) => value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function landing(url) {
  const language = url.searchParams.get('lang');
  const code = siteLanguages.includes(language) ? language : 'en';
  const canonical = new URL(url);
  canonical.searchParams.delete('metadata');
  ${cloudflare ? `const origin = new URL(${JSON.stringify(primary)}); canonical.protocol = origin.protocol; canonical.host = origin.host;` : ''}
  const alts = url.searchParams.has('record') || !url.searchParams.has('view') ? siteLanguages.map(tag=>{
    const alt = new URL(canonical);
    alt.searchParams.delete('lang');
    if (tag !== 'en') alt.searchParams.set('lang',tag);
    return '<link rel="alternate" hreflang="'+tag+'" href="'+pageEsc(alt.href)+'">';
  }).join('\\n') : '';
  const siteName = !url.searchParams.has('view') && !url.searchParams.has('record')
    ? '<script type="application/ld+json">' + JSON.stringify({
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: ${JSON.stringify(messages.en.brand)}, url: new URL('/', canonical).href
      }) + '</script>\\n'
    : '';
  if (code === 'en') canonical.searchParams.delete('lang');
  return originalPage
    .replace('<html lang="en">','<html lang="'+code+'" dir="'+(code==='ar'?'rtl':'ltr')+'">')
    ${cloudflare ? `.replace('</head>','<meta name="repository-primary" content="${primary}"></head>')` : ''}
    .replace('</head>','<link rel="canonical" href="'+pageEsc(canonical.href)+'">\\n'
      +'<link rel="alternate" type="application/rss+xml" title="Events RSS" href="https://conference.softinator.org/events.rss">\\n'
      +siteName+alts+'\\n</head>');
}
export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    ${cloudflare ? "const response = await cloudflareResponse(request, env); if (response) return response;" : "if (url.pathname.startsWith('/api/')) return handleApi(request,env,subjects);"}
    if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
    ${cloudflare ? '' : `
    if (url.pathname.startsWith('/event-sites/')) return publicEventWebsite(request,env.DB);
    const calendarId = calendarRecordId(url.pathname);
    if (calendarId) {
      let record;
      if (calendarId.startsWith('example-')) {
        record = examples.find(item => item.id === calendarId);
      } else if (calendarId.startsWith('directory-')) {
        record = curatedEvents.find(item => item.id === calendarId)
          || (await loadOrganizerSnapshot(packagedOrganizerSnapshot)).find(item => item.id === calendarId);
      } else {
        const apiUrl = new URL('/api/records/' + calendarId,url);
        const result = await handleApi(new Request(apiUrl),env,subjects);
        if (result.status === 200) record = (await result.json()).record;
        if (result.status >= 500) return new Response(null,{status:503,headers:{'Cache-Control':'no-store'}});
      }
      return eventCalendarResponse(request,record);
    }`}
    if (url.pathname === '/data/events-feed.json') {
      const data = request.method === 'HEAD' ? null : JSON.stringify(await loadOrganizerSnapshot(packagedOrganizerSnapshot));
      return new Response(data, { headers: {
        'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      } });
    }
    if (url.pathname === '/events.rss') {
      ${cloudflare ? "return Response.redirect('https://conference.softinator.org/events.rss', 302);" : `
      const now = new Date();
      const [organizerEvents, publishedEvents] = await Promise.all([
        loadOrganizerSnapshot(packagedOrganizerSnapshot, { includeArchive: false }),
        readPublishedEvents(env.DB, now).catch(() => []),
      ]);
      return eventsRssResponse(request, [...curatedEvents, ...organizerEvents], publishedEvents, now);`}
    }
    const versioned = url.pathname.startsWith(clientPrefix + '/');
    const path = url.pathname === '/' ? '/index.html' : versioned ? url.pathname.slice(clientPrefix.length) : url.pathname;
    const item = assetMap.get(path);
    const isClientAsset = clientPaths.has(path);
    if (!item || (versioned && !isClientAsset)) return new Response('Not found',{status:404});
    const cacheControl = versioned ? 'public, max-age=31536000, immutable'
      : path === '/index.html' || isClientAsset ? 'no-cache' : 'public, max-age=300';
    const headers = {
      'Content-Type':item[0],
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'Cache-Control': cacheControl
    };
    if (path === '/index.html') {
      if (url.searchParams.get('record')?.startsWith('example-')) headers['X-Robots-Tag']='noindex';
      return new Response(request.method === 'HEAD' ? null : landing(url),{headers});
    }
    return new Response(request.method === 'HEAD' ? null : body(item[1]),{headers});
  }
};
`;
const output = new URL(cloudflare ? '../dist/cloudflare/' : '../dist/server/',import.meta.url);
await mkdir(output,{recursive:true});
const result = await build({
  stdin:{contents:source,resolveDir:fileURLToPath(new URL('../',import.meta.url))},
  bundle:true, format:'esm', platform:'browser', target:'es2022', write:false, legalComments:'none'
});
await writeFile(new URL('index.js',output),result.outputFiles[0].contents);
