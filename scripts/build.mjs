import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const cloudflare = process.argv.includes('--cloudflare');
const primary = 'https://open-research-commons.softinator.chatgpt.site';
const assets = new Map([
  ['/index.html','text/html; charset=utf-8'], ['/styles.css','text/css; charset=utf-8'],
  ['/app.js','text/javascript; charset=utf-8'], ['/workflow.js','text/javascript; charset=utf-8'],
  ['/catalog-search.js','text/javascript; charset=utf-8'],
  ['/i18n.js','text/javascript; charset=utf-8'], ['/examples.js','text/javascript; charset=utf-8'],
  ['/mark.svg','image/svg+xml'], ['/images/field-notes.jpg','image/jpeg'],
  ['/data/subjects.json','application/json; charset=utf-8'], ['/data/subjects-license.txt','text/plain; charset=utf-8'],
  ['/data/countries.json','application/json; charset=utf-8'], ['/data/countries-license.txt','text/plain; charset=utf-8'],
  ['/data/events-directory.json','application/json; charset=utf-8'], ['/data/events-feed.json','application/json; charset=utf-8']
]);
const entries = await Promise.all([...assets].map(async ([path, mime]) => [
  path, [mime,(await readFile(new URL('../dist' + path,import.meta.url))).toString('base64')]
]));
const source = `
${cloudflare
  ? "import { cloudflareResponse } from './scripts/cloudflare-entry.js';"
  : "import { handleApi } from './src/worker.js';"}
const assetMap = new Map(${JSON.stringify(entries)});
const body = (base64) => Uint8Array.from(atob(base64), char => char.charCodeAt(0));
const decoder = new TextDecoder();
${cloudflare ? '' : "const subjects = new Map(JSON.parse(decoder.decode(body(assetMap.get('/data/subjects.json')[1]))).map(({code,label})=>[code,label]));"}
const siteLanguages = ['en','hi','es','fr','ar','pt','zh','ru'];
const originalPage = decoder.decode(body(assetMap.get('/index.html')[1]));
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
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const item = assetMap.get(path);
    if (!item) return new Response('Not found',{status:404});
    const headers = {
      'Content-Type':item[0],
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'Cache-Control': path === '/index.html' ? 'no-cache' : 'public, max-age=300'
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
