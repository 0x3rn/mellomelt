import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {test} from 'node:test';

const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const css=await fs.readFile(new URL('../dist/styles.css',import.meta.url),'utf8');
const bootstrap=html.match(/<script id="viewport-fit">([\s\S]*?)<\/script>/);

test('viewport sizing is ready before CSS, body, and deferred animation modules',()=>{
 assert(bootstrap,'initial viewport sizing must be included in built HTML');
 const start=html.indexOf(bootstrap[0]);
 assert(start>html.indexOf('name="viewport"'));
 assert(start<html.indexOf('rel="stylesheet"'));
 assert(start<html.indexOf('<body>'));
 assert(!bootstrap[0].includes('type="module"'));
 assert(css.includes('#desktop{zoom:var(--desktop-zoom,1)}'));
 assert(css.includes('#mobile{zoom:var(--mobile-zoom,1)}'));
});

test('first paint and subsequent fitting use the same scale at mobile and desktop widths',()=>{
 for(const width of [320,375,393,477,700,701,1024,1440,1920]){
  const properties=new Map();
  vm.runInNewContext(bootstrap[1],{window:{innerWidth:width},document:{documentElement:{style:{setProperty:(name,value)=>properties.set(name,value)}}}});
  const compact=width<=700,scale=Number(properties.get(compact?'--mobile-zoom':'--desktop-zoom'));
  assert.equal(scale,compact?width/375:Math.min(1,width/1440));
  assert.equal((compact?375:1440)*scale,Math.min(width,compact?width:1440));
 }
});

test('hero background has the same crop before and after parallax starts',()=>{
 for(const [selector,height,travel]of [['n3',993,72],['n385',649,32]]){
  const initial=Number(css.match(new RegExp('\\.'+selector+'\\{--parallax-scale:([\\d.]+)\\}'))[1]);
  assert.equal(initial,Number((1+2*(travel+2)/height).toFixed(5)));
 }
});
