const q=(id,root=document)=>root.querySelector(`[data-node-id="${id}"]`);
const status=document.querySelector('#status');let timer;
function notify(message){status.textContent=message;clearTimeout(timer);timer=setTimeout(()=>status.textContent='',4500);}
function activate(el,fn,label){if(!el)return;el.setAttribute('role','button');el.tabIndex=0;el.style.cursor='pointer';if(label)el.setAttribute('aria-label',label);el.addEventListener('click',fn);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(e);}});}
const compact=window.matchMedia('(max-width:700px)');
function fit(){const mobile=compact.matches;const el=document.querySelector(mobile?'#mobile':'#desktop');const width=mobile?375:1440;const scale=mobile?window.innerWidth/width:Math.min(1,window.innerWidth/width);el.style.zoom=scale;}
window.addEventListener('resize',fit);fit();
const jump=(id,root)=>q(id,root)?.scrollIntoView({behavior:'smooth',block:'start'});
function navigation(root,ids){
 const labels={Home:ids.home,Flavours:ids.flavours,Flavors:ids.flavours,'Our Story':ids.story,'Our story':ids.story,Store:ids.store,Rewards:ids.rewards,Contact:ids.contact,'Explore Flavors':ids.flavours,'Find a  store':ids.store};
 root.querySelectorAll('p').forEach(p=>{const text=p.textContent.trim();if(text in labels)activate(p,()=>jump(labels[text],root));});
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
// Mobile navigation follows the menu design, with an accessible close control.
activate(q('106:88'),()=>{
 if(mobile.querySelector('.open-menu'))return;
 const panel=document.querySelector('#mobile-menu').content.firstElementChild.cloneNode(true);panel.classList.add('open-menu');panel.style.zIndex='20';panel.setAttribute('role','navigation');panel.setAttribute('aria-label','Mobile navigation');
 const close=q('110:9410',panel);activate(close,()=>{panel.remove();q('106:88').focus();},'Close menu');
 for(const [node,id] of [['110:9398','105:86'],['110:9399','107:8963'],['110:9400','107:9031'],['110:9403','109:9234'],['110:9404','109:9271'],['110:9405','109:9333']])activate(q(node,panel),()=>{panel.remove();jump(id,mobile);});
 q('105:86').append(panel);close.focus();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){mobile.querySelector('.open-menu')?.remove();q('106:88').focus();}});
// Additional builder and FAQ bindings are configured from each frame's node IDs.
function builder(root,ids){
 const state={flavor:'Chocolate',base:'Cup',scoops:1,toppings:new Set(['Pistachios'])};
 const img=q(ids.image,root).querySelector('img');const summary=q(ids.summary,root),price=q(ids.price,root);let changed=false;
 const assets={Strawberry:'fc02e.png',Chocolate:'28ac8.png',Pistachio:'fbc62.png'};
 function render(){
  if(changed){img.src='./assets/'+assets[state.flavor];img.alt=state.flavor+' gelato';summary.textContent=`${state.scoops} scoop${state.scoops===1?'':'s'} - ${state.base} - ${state.toppings.size} topping${state.toppings.size===1?'':'s'}`;const extras={Sprinkles:.4,'Chocolate Sauce':.8,Carmel:.2,Marshmallows:.4,Pistachios:.1};const total=5.6+(state.scoops-1)*2+(state.base==='Cup'?0:state.base==='Cone'?.5:1)+[...state.toppings].reduce((s,k)=>s+extras[k],0);price.textContent='$'+total.toFixed(2);}
 }
 for(const [group,values] of Object.entries(ids.groups))for(const [id,val] of values){const b=q(id,root);activate(b,()=>{changed=true;if(group==='toppings'){state.toppings.has(val)?state.toppings.delete(val):state.toppings.add(val);}else state[group]=val;
  for(const [bid,bval] of values){const button=q(bid,root);button.classList.add('builder-choice');const selected=group==='toppings'?state.toppings.has(bval):state[group]===bval;button.setAttribute('aria-pressed',String(selected));button.querySelectorAll('p').forEach(p=>p.style.color='inherit');}render();},b.textContent.trim());b.setAttribute('aria-pressed',String(getComputedStyle(b).backgroundColor==='rgb(234, 76, 137)'));}
 root.addEventListener('choose-flavor',e=>{const choice=ids.groups.flavor.find(([,v])=>v===e.detail);q(choice[0],root).click();});
}
builder(desktop,{image:'42:2',summary:'42:3',price:'42:4',groups:{flavor:[['39:45','Strawberry'],['39:48','Chocolate'],['39:50','Pistachio']],base:[['40:95','Cup'],['40:97','Cone'],['40:99','Waffle Cone']],scoops:[['39:57',1],['39:59',2],['39:61',3]],toppings:[['39:69','Sprinkles'],['39:74','Chocolate Sauce'],['39:78','Carmel'],['39:82','Marshmallows'],['39:85','Pistachios']]}});
builder(mobile,{image:'107:9127',summary:'107:9129',price:'107:9130',groups:{flavor:[['107:9139','Strawberry'],['107:9141','Chocolate'],['107:9143','Pistachio']],base:[['107:9149','Cup'],['107:9151','Cone'],['107:9153','Waffle Cone']],scoops:[['107:9158',1],['107:9160',2],['107:9162',3]],toppings:[['107:9168','Sprinkles'],['107:9171','Chocolate Sauce'],['107:9174','Carmel'],['107:9178','Marshmallows'],['107:9181','Pistachios']]}});
function faqs(root,configs){
 const parents=root===desktop?['72:31','72:25','72:21','72:20','102:2']:['109:9307','109:9306','109:9302','109:9301'];
 const heightOf=e=>parseFloat(getComputedStyle(e).height);
 const original=new Map(parents.map(id=>[id,heightOf(q(id,root))]));
 const deltas=new Map();
 configs.forEach(([id,answer,initial])=>{const card=q(id,root);const height=parseFloat(getComputedStyle(card).height);let open=initial;let body=initial?card.querySelectorAll('p')[1]:null;
  const symbol=[...card.querySelectorAll('p')].find(p=>/^[xX]$/.test(p.textContent.trim()));const originalSymbol=symbol?.textContent;const symbolParent=symbol?.parentElement;
  card.setAttribute('aria-expanded',String(open));
  activate(card,()=>{open=!open;card.setAttribute('aria-expanded',String(open));if(!body){body=document.createElement('p');body.className='faq-answer';body.textContent=answer;card.append(body);}body.hidden=!open;
   if(initial){let ancestor=body.parentElement;while(ancestor!==card){ancestor.style.height=open?'':'auto';ancestor=ancestor.parentElement;}card.style.height=open?'':(root===desktop?80:37.31)+'px';}else{card.style.flexDirection=open?'column':'';card.style.alignItems=open?'stretch':'';card.style.height=open?'auto':height+'px';}
   deltas.set(id,heightOf(card)-height);const extra=[...deltas.values()].reduce((a,b)=>a+b,0);
   if(symbol){symbol.textContent=open?'×':'+';symbol.style.transform='none';if(symbolParent!==card&&symbolParent.children.length===1)symbolParent.style.transform='none';}
   for(const parent of parents)q(parent,root).style.height=(original.get(parent)+extra)+'px';
   if(root===mobile){q('109:9333',root).style.top=(8820+extra)+'px';q('105:2',root).style.height=(9589+extra)+'px';root.style.minHeight=(9589+extra)+'px';}
  },card.querySelector('p').textContent.trim());
 });
}
faqs(desktop,[['72:32','Yes. We churn our gelato in small batches every morning using fresh ingredients.',false],['72:38','',true],['72:44','Yes. Contact one of our shops to discuss gelato for your party or event.',false],['80:5','Collect a stamp each time you visit. Eight visits earn you a free treat.',false]]);
faqs(mobile,[['109:9308','Yes. We churn our gelato in small batches every morning using fresh ingredients.',false],['109:9314','',true],['109:9321','Yes. Contact one of our shops to discuss gelato for your party or event.',false],['109:9327','Collect a stamp each time you visit. Eight visits earn you a free treat.',false]]);
for(const root of [desktop,mobile])root.querySelectorAll('[data-name="Button"]').forEach(b=>{if(b.textContent.includes('Try it before'))activate(b,()=>jump(root===desktop?'37:2':'107:9117',root));});
// Font loading can alter initial box measurements, so recheck the fit afterwards.
document.fonts.ready.then(fit);
