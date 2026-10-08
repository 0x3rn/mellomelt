const q=(id,root=document)=>root.querySelector(`[data-node-id="${id}"]`);
const optimizedImages=JSON.parse(document.querySelector('#image-assets')?.textContent||'{}');
const status=document.querySelector('#status');let timer;
const hoverMotion=window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
const hoverAnimations=new WeakMap();
function bindHoverMotion(el,kind){
 if(kind==='link'||kind==='disclosure')return;
 let hovered=false,pressed=false;
 const move=()=>{
  hoverAnimations.get(el)?.stop();
  if(!hoverMotion.matches){el.style.translate='';return;}
  const lift=hovered&&!pressed?(kind==='icon'?-1:-2):0;
  // One native Motion animation owns movement. Reversals start where it is now.
  hoverAnimations.set(el,window.Motion.animate(el,{translate:`0px ${lift}px`},
   {duration:pressed ? 0.12 : 0.32,ease:[.22,.61,.36,1]}));
 };
 el.addEventListener('pointerenter',()=>{hovered=true;move();});
 el.addEventListener('pointerleave',()=>{hovered=false;pressed=false;move();});
 el.addEventListener('pointerdown',()=>{pressed=true;move();});
 el.addEventListener('pointerup',()=>{pressed=false;move();});
 el.addEventListener('pointercancel',()=>{pressed=false;hovered=false;move();});
}
hoverMotion.addEventListener('change',()=>{
 if(hoverMotion.matches)return;
 document.querySelectorAll('.interactive-control').forEach(el=>{hoverAnimations.get(el)?.stop();el.style.translate='';});
});
function notify(message){status.textContent=message;clearTimeout(timer);timer=setTimeout(()=>status.textContent='',4500);}
function activate(el,fn,label){
 if(!el)return;
 const kind=el.matches('p')?'link':el.hasAttribute('aria-controls')||label==='Close menu'?'icon':el.hasAttribute('aria-expanded')?'disclosure':'button';
 el.classList.add('interactive-control',`interactive-${kind}`);
 bindHoverMotion(el,kind);
 el.setAttribute('role','button');el.tabIndex=0;el.style.cursor='pointer';
 if(label)el.setAttribute('aria-label',label);
 el.addEventListener('click',fn);
 el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(e);}});
}
const compact=window.matchMedia('(max-width:700px)');
function fit(){const mobile=compact.matches;const el=document.querySelector(mobile?'#mobile':'#desktop');const width=mobile?375:1440;const scale=mobile?window.innerWidth/width:Math.min(1,window.innerWidth/width);el.style.zoom=scale;}
window.addEventListener('resize',fit);fit();
const jump=(id,root)=>q(id,root)?.scrollIntoView({behavior:'smooth',block:'start'});
function navigation(root,ids){
 const labels={Home:ids.home,Flavours:ids.flavours,Flavors:ids.flavours,'Our Story':ids.story,'Our story':ids.story,Store:ids.store,Rewards:ids.rewards,Contact:ids.contact,'Explore Flavors':ids.flavours,'Find a  store':ids.store};
 root.querySelectorAll('p').forEach(p=>{const text=p.textContent.trim();if(text in labels)activate(p.closest('[data-name="Button"]')||p,()=>jump(labels[text],root));});
}
const desktop=document.querySelector('#desktop'),mobile=document.querySelector('#mobile');
navigation(desktop,{home:'18:5152',flavours:'19:5203',story:'23:2',store:'57:308',rewards:'60:95',contact:'90:146'});
navigation(mobile,{home:'105:86',flavours:'107:8963',story:'107:9031',store:'109:9234',rewards:'109:9271',contact:'109:9333'});
// All design buttons remain in their original slots; add accessible interactions.
for(const root of [desktop,mobile]){
 root.querySelectorAll('[data-name="Button"]').forEach(button=>{
  const label=button.textContent.trim();
  if(label==='Buy now')activate(button,()=>{const flavor=button.parentElement.textContent.includes('Belgian')?'Chocolate':button.parentElement.textContent.includes('Pistachio')?'Pistachio':'Strawberry';root.dispatchEvent(new CustomEvent('choose-flavor',{detail:flavor}));jump(root===desktop?'37:2':'107:9117',root);});
  else if(label==='Order')activate(button,()=>notify('Your scoop is ready. Visit one of our shops to order.'));
 });
}
// Reveal the mobile menu and stagger its contents, with matching exit motion.
const menuTrigger=q('106:88');
const menuReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const menuHover=window.matchMedia('(hover:hover) and (pointer:fine)');
menuTrigger.setAttribute('aria-expanded','false');
menuTrigger.setAttribute('aria-controls','mobile-navigation');
menuTrigger.setAttribute('aria-haspopup','dialog');
let currentMenu=null;
let menuHoverTimer;
const cancelMenuHoverClose=()=>clearTimeout(menuHoverTimer);
const scheduleMenuHoverClose=()=>{
 cancelMenuHoverClose();
 menuHoverTimer=setTimeout(()=>{
  if(currentMenu?.hoverOpened)currentMenu.close({restoreFocus:false});
 },180);
};
function openMenu({hover=false}={}){
 if(currentMenu)return;
 const panel=document.querySelector('#mobile-menu').content.firstElementChild.cloneNode(true);
 panel.classList.add('open-menu');panel.id='mobile-navigation';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal',String(!hover));panel.setAttribute('aria-label','Main menu');
 const backdrop=document.createElement('div');backdrop.className='menu-backdrop';backdrop.setAttribute('aria-hidden','true');
 const previousOverflow=document.body.style.overflow;
 const opening=[];let closing=false;
 const closeMenu=({restoreFocus=!currentMenu?.hoverOpened,after,immediate=false}={})=>{
  if(closing)return;closing=true;menuTrigger.setAttribute('aria-expanded','false');panel.style.pointerEvents='none';
  cancelMenuHoverClose();
  opening.forEach(animation=>animation.stop());
  const finish=()=>{panel.remove();backdrop.remove();document.body.style.overflow=previousOverflow;currentMenu=null;if(restoreFocus)menuTrigger.focus();after?.();};
  if(immediate||menuReducedMotion.matches){finish();return;}
  window.Motion.animate(panel,{opacity:0,clipPath:'inset(0 0 100% 0 round 16px)'},{duration:.24,ease:[.4,0,1,1]}).finished.then(finish);
 };
 currentMenu={panel,close:closeMenu,hoverOpened:hover,pin:()=>{
  cancelMenuHoverClose();currentMenu.hoverOpened=false;panel.setAttribute('aria-modal','true');document.body.style.overflow='hidden';close.focus();
 }};
 const close=q('110:9410',panel);activate(close,()=>closeMenu(),'Close menu');
 const links=[];
 for(const [node,id] of [['110:9398','105:86'],['110:9399','107:8963'],['110:9400','107:9031'],['110:9403','109:9234'],['110:9404','109:9271'],['110:9405','109:9333']]){
  const link=q(node,panel);links.push(link);activate(link,()=>closeMenu({restoreFocus:false,after:()=>jump(id,mobile)}));
 }
 q('110:9407',panel).setAttribute('role','navigation');
 q('110:9407',panel).setAttribute('aria-label','Mobile navigation');
 q('105:86').append(backdrop,panel);if(!hover)document.body.style.overflow='hidden';menuTrigger.setAttribute('aria-expanded','true');
 panel.addEventListener('pointerenter',cancelMenuHoverClose);
 panel.addEventListener('pointerleave',e=>{
  if(e.pointerType==='mouse'&&currentMenu?.hoverOpened&&!menuTrigger.contains(e.relatedTarget))scheduleMenuHoverClose();
 });
 panel.addEventListener('focusin',()=>{
  if(currentMenu?.hoverOpened){cancelMenuHoverClose();currentMenu.hoverOpened=false;panel.setAttribute('aria-modal','true');document.body.style.overflow='hidden';}
 });
 backdrop.addEventListener('click',()=>closeMenu());
 if(!menuReducedMotion.matches){
  const ease=[.22,1,.36,1];
  opening.push(window.Motion.animate(panel,{opacity:[0,1],clipPath:['inset(0 0 100% 0 round 16px)','inset(0 0 0% 0 round 16px)']},{duration:.48,ease}));
  links.forEach((link,index)=>opening.push(window.Motion.animate(link,{opacity:[0,1],transform:['translateY(12px)','translateY(0px)']},{duration:.35,delay:.1+index*.045,ease})));
  opening.push(window.Motion.animate(close,{opacity:[0,1]},{duration:.2,delay:.08}));
  opening.push(window.Motion.animate(q('110:9408',panel),{opacity:[0,1],transform:['translateY(10px)','translateY(0px)']},{duration:.4,delay:.22,ease}));
 }
 if(!hover)close.focus();
}
activate(menuTrigger,()=>{
 if(currentMenu?.hoverOpened){currentMenu.pin();return;}
 openMenu();
},'Open menu');
menuTrigger.addEventListener('pointerenter',e=>{
 if(e.pointerType!=='mouse'||!menuHover.matches)return;
 cancelMenuHoverClose();openMenu({hover:true});
});
menuTrigger.addEventListener('pointerleave',e=>{
 if(e.pointerType==='mouse'&&currentMenu?.hoverOpened&&!currentMenu.panel.contains(e.relatedTarget))scheduleMenuHoverClose();
});
menuHover.addEventListener('change',()=>{
 if(!menuHover.matches&&currentMenu?.hoverOpened)currentMenu.close({immediate:true,restoreFocus:false});
});
document.addEventListener('keydown',e=>{
 if(!currentMenu)return;
 if(e.key==='Escape'){e.preventDefault();currentMenu.close();}
 if(e.key==='Tab'&&!currentMenu.hoverOpened){
  const focusable=[...currentMenu.panel.querySelectorAll('[tabindex="0"]')];
  const first=focusable[0],last=focusable.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
window.addEventListener('resize',()=>{if(!compact.matches)currentMenu?.close({immediate:true,restoreFocus:false});});
// Additional builder and FAQ bindings are configured from each frame's node IDs.
function builder(root,ids){
 const state={flavor:'Strawberry',base:'Cup',scoops:1,toppings:new Set(['Pistachios'])};
 const img=q(ids.image,root).querySelector('img');const summary=q(ids.summary,root),price=q(ids.price,root);let changed=false;
 const assets={Strawberry:'fc02e.png',Chocolate:'28ac8.png',Pistachio:'fbc62.png'};
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const animations=new Map();
 const animate=(element,keyframes,options={})=>{
  if(reduceMotion.matches)return;
  animations.get(element)?.stop();
  const playback=window.Motion.animate(element,keyframes,{duration:.32,ease:[.22,1,.36,1],...options});
  animations.set(element,playback);
  playback.finished.then(()=>{if(animations.get(element)===playback)animations.delete(element);});
 };
 const updateText=(element,text)=>{
  if(element.textContent.trim()===text)return;
  element.textContent=text;
  animate(element,{opacity:[.55,1],translate:['0 4px','0 0']},{duration:.28});
 };
 function render(){
  if(!changed)return;
  const asset=assets[state.flavor],source='./assets/'+asset;
  if((img.dataset.asset||img.getAttribute('src')?.split('/').pop())!==asset){
   const pictureSource=img.closest('picture')?.querySelector('source');
   if(pictureSource&&optimizedImages[asset])pictureSource.srcset=optimizedImages[asset].srcset;
   else img.src=source;
   img.dataset.asset=asset;
   animate(img,{opacity:[.45,1],scale:[.97,1]},{duration:.38});
  }
  img.alt=state.flavor+' gelato';
  updateText(summary,`${state.scoops} scoop${state.scoops===1?'':'s'} - ${state.base} - ${state.toppings.size} topping${state.toppings.size===1?'':'s'}`);
  const extras={Sprinkles:.4,'Chocolate Sauce':.8,Carmel:.2,Marshmallows:.4,Pistachios:.1};
  const total=5.6+(state.scoops-1)*2+(state.base==='Cup'?0:state.base==='Cone'?.5:1)+[...state.toppings].reduce((s,k)=>s+extras[k],0);
  updateText(price,'$'+total.toFixed(2));
 }
 for(const [group,values] of Object.entries(ids.groups))for(const [id,val] of values){
  const b=q(id,root);
  const initiallySelected=getComputedStyle(b).backgroundColor==='rgb(234, 76, 137)';
  b.setAttribute('aria-pressed',String(initiallySelected));
  b.classList.add('builder-choice');
  b.querySelectorAll('p').forEach(p=>p.style.color='inherit');
  activate(b,()=>{
   changed=true;
   if(group==='toppings'){state.toppings.has(val)?state.toppings.delete(val):state.toppings.add(val);}else state[group]=val;
   for(const [bid,bval] of values){
    const button=q(bid,root);
    const selected=group==='toppings'?state.toppings.has(bval):state[group]===bval;
    button.setAttribute('aria-pressed',String(selected));
   }
   animate(b,{scale:[1,.96,1.015,1]},{duration:.34});
   render();
  },b.textContent.trim());
 }
 root.addEventListener('choose-flavor',e=>{const choice=ids.groups.flavor.find(([,v])=>v===e.detail);q(choice[0],root).click();});
}
builder(desktop,{image:'42:2',summary:'42:3',price:'42:4',groups:{flavor:[['39:45','Strawberry'],['39:48','Chocolate'],['39:50','Pistachio']],base:[['40:95','Cup'],['40:97','Cone'],['40:99','Waffle Cone']],scoops:[['39:57',1],['39:59',2],['39:61',3]],toppings:[['39:69','Sprinkles'],['39:74','Chocolate Sauce'],['39:78','Carmel'],['39:82','Marshmallows'],['39:85','Pistachios']]}});
builder(mobile,{image:'107:9127',summary:'107:9129',price:'107:9130',groups:{flavor:[['107:9139','Strawberry'],['107:9141','Chocolate'],['107:9143','Pistachio']],base:[['107:9149','Cup'],['107:9151','Cone'],['107:9153','Waffle Cone']],scoops:[['107:9158',1],['107:9160',2],['107:9162',3]],toppings:[['107:9168','Sprinkles'],['107:9171','Chocolate Sauce'],['107:9174','Carmel'],['107:9178','Marshmallows'],['107:9181','Pistachios']]}});
function faqs(root,configs){
 const parents=root===desktop?['72:31','72:25','72:21','72:20','102:2']:['109:9307','109:9306','109:9302','109:9301'];
 const heightOf=e=>parseFloat(getComputedStyle(e).height);
 const original=new Map(parents.map(id=>[id,heightOf(q(id,root))]));
 const baselines=new Map(configs.map(([id])=>[id,heightOf(q(id,root))]));
 const updateLayout=()=>{
  if(getComputedStyle(root).display==='none')return;
  const extra=configs.reduce((total,[id])=>total+heightOf(q(id,root))-baselines.get(id),0);
  for(const parent of parents)q(parent,root).style.height=(original.get(parent)+extra)+'px';
  if(root===mobile){q('109:9333',root).style.top=(8820+extra)+'px';q('105:2',root).style.height=(9589+extra)+'px';root.style.minHeight=(9589+extra)+'px';}
 };
 configs.forEach(([id,answer,initial])=>{
  const card=q(id,root),question=card.querySelector('p');let open=initial;
  const answerText=initial?card.querySelectorAll('p')[1].textContent.trim():answer;
  const header=document.createElement('div');header.className='faq-content';question.classList.add('faq-question');header.append(question);
  const icon=document.createElement('span');icon.className='faq-icon';icon.setAttribute('aria-hidden','true');
  const glyph=document.createElement('span');glyph.className='faq-icon-glyph';glyph.textContent='x';icon.append(glyph);
  const body=document.createElement('p');body.className='faq-answer';body.textContent=answerText;body.hidden=!open;
  card.classList.add('faq-card');card.replaceChildren(header,icon,body);
  card.style.flexDirection='column';card.style.alignItems='stretch';card.style.height='auto';
  card.setAttribute('aria-expanded',String(open));
  activate(card,()=>{open=!open;card.setAttribute('aria-expanded',String(open));body.hidden=!open;updateLayout();},question.textContent.trim());
 });
 updateLayout();window.addEventListener('resize',updateLayout);document.fonts.ready.then(updateLayout);
}
faqs(desktop,[['72:32','Yes. We churn our gelato in small batches every morning using fresh ingredients.',false],['72:38','',true],['72:44','Yes. Contact one of our shops to discuss gelato for your party or event.',false],['80:5','Collect a stamp each time you visit. Eight visits earn you a free treat.',false]]);
faqs(mobile,[['109:9308','Yes. We churn our gelato in small batches every morning using fresh ingredients.',false],['109:9314','',true],['109:9321','Yes. Contact one of our shops to discuss gelato for your party or event.',false],['109:9327','Collect a stamp each time you visit. Eight visits earn you a free treat.',false]]);
for(const root of [desktop,mobile])root.querySelectorAll('[data-name="Button"]').forEach(b=>{if(b.textContent.includes('Try it before'))activate(b,()=>jump(root===desktop?'37:2':'107:9117',root));});
// Font loading can alter initial box measurements, so recheck the fit afterwards.
document.fonts.ready.then(fit);

// Duplicate the full feature sequence so the loop joins without a gap or jump.
document.fonts.ready.then(()=>{
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 for(const [root,id] of [[desktop,'19:5275'],[mobile,'107:8993']]){
  const strip=q(id,root),sequence=strip.firstElementChild;
  strip.classList.add('feature-marquee');sequence.classList.add('feature-sequence');
  const track=document.createElement('div');track.className='feature-track';
  const repeated=sequence.cloneNode(true);repeated.setAttribute('aria-hidden','true');
  track.append(sequence,repeated);strip.append(track);
  const cycleWidth=parseFloat(getComputedStyle(sequence).width);
  let playback;
  const start=()=>{
   playback?.cancel();
   if(reduceMotion.matches)return;
   playback=window.Motion.animate(track,{transform:['translateX(0px)',`translateX(-${cycleWidth}px)`]},
    {duration:cycleWidth/55,ease:'linear',repeat:Infinity});
  };
  reduceMotion.addEventListener('change',start);start();
 }
});
