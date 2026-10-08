import assert from 'node:assert/strict';
import {test} from 'node:test';
import {setupReveals} from '../src/reveals.js';

class Events{
 listeners=new Map();
 addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);}
 removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
 emit(name,event={}){for(const fn of this.listeners.get(name)||[])fn(event);}
}
function element(){
 const classes=new Set(),styles=new Map([['transform','translateX(-50%)']]);
 return{classes,style:{getPropertyValue:name=>styles.get(name)||'',setProperty:(name,value)=>styles.set(name,value),removeProperty:name=>styles.delete(name)},
  classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)},contains(target){return target===this||target?.parent===this;}};
}
function environment({reduced=false,missingMotion=false,throws=false}={}){
 const oldWindow=globalThis.window,oldDocument=globalThis.document,oldObserver=globalThis.IntersectionObserver;
 const reduce=Object.assign(new Events(),{matches:reduced}),compact={matches:false},document=new Events();
 const desktopNodes=new Map(['.n38','.n42','.n51','.n60','.n304'].map(selector=>[selector,element()]));
 const mobileNodes=new Map(['.n413','.n417','.n426','.n435','.n680'].map(selector=>[selector,element()]));
 const desktop={querySelector:selector=>desktopNodes.get(selector)},mobile={querySelector:selector=>mobileNodes.get(selector)};
 const playbacks=[];let observer;
 class Observer{
  targets=new Set();constructor(callback){this.callback=callback;observer=this;}
  observe(target){this.targets.add(target);}unobserve(target){this.targets.delete(target);}disconnect(){this.targets.clear();}
 }
 const Motion=missingMotion?undefined:{animate(target,keyframes,options){
  if(throws)throw Error('animation unavailable');
  let resolve;const playback={target,keyframes,options,stopped:false,finished:new Promise(done=>{resolve=done;}),stop(){this.stopped=true;},complete(){resolve();}};
  playbacks.push(playback);return playback;
 }};
 globalThis.window={Motion,IntersectionObserver:Observer,matchMedia:query=>query.includes('reduced-motion')?reduce:compact};
 globalThis.IntersectionObserver=Observer;globalThis.document=document;
 const cleanup=setupReveals({desktop,mobile});
 const enter=targets=>observer?.callback(targets.map(target=>({target,isIntersecting:true})));
 const restore=()=>{cleanup();for(const [name,value]of [['window',oldWindow],['document',oldDocument],['IntersectionObserver',oldObserver]]){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}};
 return{reduce,compact,document,desktopNodes,mobileNodes,playbacks,enter,restore};
}

test('reveals play once, stagger the flavor cards, and preserve existing transforms',async()=>{
 const env=environment();try{
  const cards=['.n42','.n51','.n60'].map(selector=>env.desktopNodes.get(selector));
  env.enter(cards);assert.equal(env.playbacks.length,3);assert.deepEqual(env.playbacks.map(playback=>playback.options.delay),[0,.075,.15]);
  env.enter(cards);assert.equal(env.playbacks.length,3,'re-entry must not replay');
  for(const playback of env.playbacks){assert(!('transform' in playback.keyframes));playback.complete();}
  await Promise.resolve();
  for(const card of cards){assert(!card.classes.has('reveal-pending'));assert.equal(card.style.getPropertyValue('transform'),'translateX(-50%)');}
 }finally{env.restore();}
});

test('keyboard focus shows the focused content immediately',()=>{
 const env=environment();try{
  const card=env.desktopNodes.get('.n42');env.document.emit('focusin',{target:{parent:card}});
  assert(!card.classes.has('reveal-pending'));env.enter([card]);assert.equal(env.playbacks.length,0);
 }finally{env.restore();}
});

test('reduced motion leaves all content visible, including during a reveal',()=>{
 for(const reduced of [false,true]){
  const env=environment({reduced});try{
   if(!reduced){env.enter([env.desktopNodes.get('.n38')]);env.reduce.matches=true;env.reduce.emit('change');assert(env.playbacks[0].stopped);}
   for(const item of [...env.desktopNodes.values(),...env.mobileNodes.values()])assert(!item.classes.has('reveal-pending'));
  }finally{env.restore();}
 }
});

test('missing or failed animation support never leaves hidden content',()=>{
 for(const option of [{missingMotion:true},{throws:true}]){
  const env=environment(option);try{
   const heading=env.desktopNodes.get('.n38');env.enter([heading]);assert(!heading.classes.has('reveal-pending'));
  }finally{env.restore();}
 }
});

test('hidden responsive layouts do not consume their reveal',()=>{
 const env=environment();try{
  const heading=env.mobileNodes.get('.n413');env.enter([heading]);assert.equal(env.playbacks.length,0);
  env.compact.matches=true;env.enter([heading]);assert.equal(env.playbacks.length,1);assert.deepEqual(env.playbacks[0].keyframes.translate,['0px 16px','0px 0px']);
 }finally{env.restore();}
});
