import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
await import('./build.mjs');
const root=path.resolve(import.meta.dirname,'../dist');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file===root)file=path.join(root,'index.html');
  if(!file.startsWith(root+path.sep))throw Error();
  const stat=await fs.stat(file);
  const etag=`W/"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
  const immutable=/-[a-f0-9]{10}\.(webp|png)$/.test(file);
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':immutable?'public, max-age=31536000, immutable':'no-cache','ETag':etag};
  if(req.headers['if-none-match']===etag){res.writeHead(304,headers);res.end();return;}
  const data=await fs.readFile(file);
  res.writeHead(200,{...headers,'Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
