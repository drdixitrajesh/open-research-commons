import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const cloudflare = process.argv.includes('--cloudflare');
const primary = 'https://open-research-commons.softinator.chatgpt.site';
const assets = new Map([
  ['/index.html','text/html; charset=utf-8'], ['/styles.css','text/css; charset=utf-8'],
  ['/app.js','text/javascript; charset=utf-8'], ['/workflow.js','text/javascript; charset=utf-8'],
  ['/catalog-search.js','text/javascript; charset=utf-8'],
  ['/event-filters.js','text/javascript; charset=utf-8'],
  ['/i18n.js','text/javascript; charset=utf-8'], ['/examples.js','text/javascript; charset=utf-8'],
  ['/mark.svg','image/svg+xml'], ['/images/field-notes.jpg','image/jpeg'],
  ['/data/subjects.json','application/json; charset=utf-8'], ['/data/subjects-license.txt','text/plain; charset=utf-8'],
  ['/data/countries.json','application/json; charset=utf-8'], ['/data/countries-license.txt','text/plain; charset=utf-8'],
  ['/data/events-directory.json','application/json; charset=utf-8'], ['/data/events-feed.json','application/json; charset=utf-8']
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
  : "import { handleApi } from './src/worker.js';"}
const assetMap = new Map(${JSON.stringify(entries)});
const clientPaths = new Set(${JSON.stringify(clientAssets.map(([path]) => path))});
const clientPrefix = ${JSON.stringify(clientPrefix)};
const body = (base64) => Uint8Array.from(atob(base64), char => char.charCodeAt(0));
const decoder = new TextDecoder();
${cloudflare ? '' : "const subjects = new Map(JSON.parse(decoder.decode(body(assetMap.get('/data/subjects.json')[1]))).map(({code,label})=>[code,label]));"}
const siteLanguages = ['en','hi','es','fr','ar','pt','zh','ru'];
const originalPage = decoder.decode(body(assetMap.get('/index.html')[1]))
  .replace('src="/app.js"', 'src="' + clientPrefix + '/app.js"')
  .replace('href="/styles.css"', 'href="' + clientPrefix + '/styles.css"');
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
  if (code === 'en') canonical.searchParams.delete('lang');
  return originalPage
    .replace('<html lang="en">','<html lang="'+code+'" dir="'+(code==='ar'?'rtl':'ltr')+'">')
    ${cloudflare ? `.replace('</head>','<meta name="repository-primary" content="${primary}"></head>')` : ''}
    .replace('</head>','<link rel="canonical" href="'+pageEsc(canonical.href)+'">\\n'+alts+'\\n</head>');
}
export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    ${cloudflare ? "const response = await cloudflareResponse(request, env); if (response) return response;" : "if (url.pathname.startsWith('/api/')) return handleApi(request,env,subjects);"}
    if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
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
