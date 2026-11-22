import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
import { calendarRecordId, eventCalendarResponse } from '../src/event-calendar-response.js';
import { examples } from '../dist/examples.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.svg':'image/svg+xml','.txt':'text/plain'};
const port = Number(process.env.REPOSITORY_PREVIEW_PORT || 4321);
createServer(async (req,res)=>{
  const url = new URL(req.url,'http://127.0.0.1');
  const path = url.pathname;
  const calendarId = calendarRecordId(path);
  if (calendarId) {
    try {
      let record = examples.find(item=>item.id===calendarId);
      if (!record && calendarId.startsWith('directory-')) {
        const read = name => readFile(resolve(root,'data',name+'.json'),'utf8').then(JSON.parse);
        const [curated, imported] = await Promise.all([read('events-directory'),read('events-feed')]);
        record = [...curated,...imported].find(item=>item.id===calendarId);
      }
      const response = eventCalendarResponse(new Request(url,{method:req.method}),record);
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch {
      res.writeHead(500).end();
    }
    return;
  }
  if (path==='/api/session' || path==='/api/records') {
    const response = path.endsWith('session') ? {user:null,persistent:false,files:false} : {records:[]};
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify(response));
    return;
  }
  const file = resolve(root,'.' + (path==='/' ? '/index.html' : path));
  const extension = extname(file);
  if (!file.startsWith(root.endsWith(sep)?root:root+sep) || !types[extension] || path.startsWith('/server/')) {
    res.writeHead(404).end();
    return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200,{'Content-Type':types[extension]+(types[extension].startsWith('image/')?'':';charset=utf-8'),'Cache-Control':'no-store'});
    res.end(data);
  } catch { res.writeHead(404).end(); }
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
