import assert from 'node:assert/strict';
import {test} from 'node:test';
import {setupParallax} from '../src/parallax.js';

class Events{
 listeners=new Map();
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
 removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
 emit(type){for(const fn of this.listeners.get(type)||[])fn();}
}
function element(top,height){
 const properties=new Map(),classes=new Set();
 return{rect:{top,height,bottom:top+height},nodes:new Map(),classList:{add:name=>classes.add(name)},
  style:{zoom:'1',willChange:'',setProperty:(name,value)=>properties.set(name,value),removeProperty:name=>properties.delete(name),getPropertyValue:name=>properties.get(name)||''},
  querySelector(selector){return this.nodes.get(selector)||null;},getBoundingClientRect(){return this.rect;}};
}
function environment({mobile=false,reduced=false}={}){
 const previous=Object.fromEntries(['window','document','IntersectionObserver','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'].map(name=>[name,globalThis[name]]));
 const compact=Object.assign(new Events(),{matches:mobile}),reduce=Object.assign(new Events(),{matches:reduced});
 const window=Object.assign(new Events(),{innerHeight:800,matchMedia:query=>query.includes('reduced-motion')?reduce:compact});
 const document=Object.assign(new Events(),{hidden:false,fonts:{ready:Promise.resolve()}});
 const roots={desktop:element(0,8200),mobile:element(0,9590)};
 const items={};
 for(const [name,root]of Object.entries(roots)){
  const small=name==='mobile',hero=element(0,small?649:993),photo=element(600,small?448:533),footer=element(7400,160);
  const sky=element(0,hero.rect.height),cup=element(0,200),picture=element(600,photo.rect.height),endCup=element(7400,160);
  sky.parentElement=hero;cup.parentElement=hero;picture.parentElement=photo;endCup.parentElement=footer;
  for(const img of [sky,cup,picture,endCup])img.closest=()=>null;
  for(const [selector,node]of [[small?'.n384':'.n2',hero],[small?'.n385':'.n3',sky],[small?'.n388':'.n27',cup],[small?'.n468':'.n92',picture],[small?'.n753':'.n378',endCup]])root.nodes.set(selector,node);
  items[name]={hero,photo,sky,cup,picture,endCup};
 }
 const queue=new Map();let nextId=0,time=0,observer;
 globalThis.window=window;globalThis.document=document;
 globalThis.requestAnimationFrame=fn=>{queue.set(++nextId,fn);return nextId;};globalThis.cancelAnimationFrame=id=>queue.delete(id);
 globalThis.IntersectionObserver=class{targets=[];constructor(callback){this.callback=callback;observer=this;}observe(target){this.targets.push(target);}disconnect(){} };
 globalThis.ResizeObserver=class{observe(){}disconnect(){} };
 const cleanup=setupParallax(roots);
 const enter=()=>observer.callback(observer.targets.map(target=>({target,isIntersecting:true})));
 const tick=()=>{time+=16;const pending=[...queue];queue.clear();for(const [,fn]of pending)fn(time);};
 const settle=()=>{let count=0;while(queue.size&&count++<200)tick();assert.equal(queue.size,0,'animation should sleep once movement settles');};
 const move=(el,top)=>{el.rect={...el.rect,top,bottom:top+el.rect.height};};
 const restore=()=>{cleanup();for(const [name,value]of Object.entries(previous)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}};
 return{...items,window,document,compact,reduce,queue,enter,tick,settle,move,restore};
}
const value=(image,property)=>parseFloat(image.style.getPropertyValue(property));

test('hero layers move at different speeds, stay bounded, and stop at rest',()=>{
 const env=environment();try{
  env.enter();env.settle();assert.equal(value(env.desktop.sky,'--parallax-y'),0);
  env.move(env.desktop.hero,-300);env.window.emit('scroll');env.settle();
  assert(value(env.desktop.sky,'--parallax-y')>0);assert(value(env.desktop.cup,'--parallax-y')<0);
  env.move(env.desktop.hero,-1000);env.window.emit('scroll');env.settle();
  assert(value(env.desktop.sky,'--parallax-y')<=72);assert(value(env.desktop.cup,'--parallax-y')>=-32);
  assert.equal(env.mobile.sky.style.getPropertyValue('--parallax-y'),'','hidden layout must stay idle');
 }finally{env.restore();}
});

test('photo overscan covers the complete vertical travel on both layouts',()=>{
 for(const mobile of [false,true]){
  const env=environment({mobile});try{
   const active=mobile?env.mobile:env.desktop,travel=mobile?14:22;
   env.enter();env.settle();const scale=value(active.picture,'--parallax-scale');
   assert((scale-1)*active.photo.rect.height/2>=travel,'extra image height must cover the maximum offset');
   for(const top of [700,300,-200]){env.move(active.photo,top);env.window.emit('scroll');env.settle();assert(Math.abs(value(active.picture,'--parallax-y'))<=travel);}
  }finally{env.restore();}
 }
});

test('reduced motion clears effects and prevents animation work',()=>{
 const env=environment();try{
  env.enter();env.settle();env.reduce.matches=true;env.reduce.emit('change');
  assert.equal(env.desktop.sky.style.getPropertyValue('--parallax-y'),'');assert.equal(env.desktop.sky.style.willChange,'');
  env.window.emit('scroll');assert.equal(env.queue.size,0);
  env.reduce.matches=false;env.reduce.emit('change');env.settle();assert(Number.isFinite(value(env.desktop.sky,'--parallax-y')));
 }finally{env.restore();}
});

test('responsive changes reset the old layout and animate only the visible frame',()=>{
 const env=environment();try{
  env.enter();env.settle();env.compact.matches=true;env.compact.emit('change');env.settle();
  assert.equal(env.desktop.sky.style.getPropertyValue('--parallax-y'),'');assert(Number.isFinite(value(env.mobile.sky,'--parallax-y')));
  env.move(env.mobile.hero,-500);env.window.emit('scroll');env.settle();
  assert(value(env.mobile.sky,'--parallax-y')<=32);assert(value(env.mobile.cup,'--parallax-y')>=-12);
  env.document.hidden=true;env.document.emit('visibilitychange');env.window.emit('scroll');assert.equal(env.queue.size,0);
 }finally{env.restore();}
});
