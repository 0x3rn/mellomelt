import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {test} from 'node:test';
import worker from '../worker/index.js';
const output=path.resolve(import.meta.dirname,'../dist');
const host='mellomelt.corstack.dev';
const files=async(url,method='GET')=>{
 const pathname=new URL(url).pathname;
 const file=path.resolve(output,'.'+decodeURIComponent(pathname));
 if(!file.startsWith(output+path.sep))return new Response(null,{status:404});
 try {const data=await fs.readFile(file);return new Response(method==='HEAD'?null:data,{headers:{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.xml')?'application/xml':file.endsWith('.txt')?'text/plain':'application/octet-stream'}})}catch{return new Response(null,{status:404})}
};
const env={ASSETS:{fetch:request=>files(request.url,request.method)}};
const request=(pathname,options={})=>worker.fetch(new Request('https://'+host+pathname,options),env);
test('HTTP redirects preserve paths and query strings',async()=>{
 const response=await worker.fetch(new Request('http://'+host+'/?campaign=test'),env);
 assert.equal(response.status,301);assert.equal(response.headers.get('location'),'https://'+host+'/?campaign=test');
});
test('alternate hosts and HTML aliases redirect to the canonical address',async()=>{
 const alternate=await worker.fetch(new Request('https://preview.workers.dev/'),env);
 assert.equal(alternate.status,301);assert.equal(alternate.headers.get('location'),'https://'+host+'/');
 const alias=await request('/index.html?campaign=test');
 assert.equal(alias.status,301);assert.equal(alias.headers.get('location'),'https://'+host+'/?campaign=test');
});
test('homepage has rendered content and one self canonical',async()=>{
 const response=await request('/');assert.equal(response.status,200);
 const html=await response.text();assert.match(html,/<h1[ >]/);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.ok(html.includes('href="https://'+host+'/"'));
});
test('crawl files have real text/XML contents',async()=>{
 const robots=await request('/robots.txt');assert.equal(robots.status,200);assert.match(robots.headers.get('content-type'),/text\/plain/);
 assert.ok((await robots.text()).includes('Sitemap: https://'+host+'/sitemap.xml'));
 const sitemap=await request('/sitemap.xml');assert.equal(sitemap.status,200);assert.match(await sitemap.text(),/^<\?xml/);
});
test('unknown pages and missing assets return a real noindex 404',async()=>{
 for(const pathname of ['/not-a-page','/not-a-page/','/assets/missing.js','/404.html']){
  const response=await request(pathname);assert.equal(response.status,404,pathname);assert.equal(response.headers.get('x-robots-tag'),'noindex');
  assert.match(await response.text(),/<h1>Page not found<\/h1>/);
 }
 const head=await request('/not-a-page',{method:'HEAD'});assert.equal(head.status,404);assert.equal(await head.text(),'');
});
test('HEAD responses have no body and unsupported methods are rejected',async()=>{
 const head=await request('/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 const post=await request('/',{method:'POST'});assert.equal(post.status,405);assert.equal(post.headers.get('allow'),'GET, HEAD');
});
