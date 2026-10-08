const groups=[
 {desktop:['.n38','.n111','.n221','.n256','.n301'],mobile:['.n413','.n484','.n596','.n630','.n677']},
 {desktop:['.n42','.n51','.n60'],mobile:['.n417','.n426','.n435'],stagger:.075},
 {desktop:['.n96','.n100'],mobile:['.n469','.n476'],stagger:.06},
 {desktop:['.n227'],mobile:['.n601','.n615'],stagger:.06},
 {desktop:['.n260'],mobile:['.n634']},
 {desktop:['.n269','.n279','.n289'],mobile:['.n643','.n653','.n664'],stagger:.07},
 {desktop:['.n304'],mobile:['.n680']},
];

export function setupReveals({desktop,mobile}){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!window.Motion?.animate||!window.IntersectionObserver)return()=>{};
 const compact=window.matchMedia('(max-width:700px)'),records=new Map();
 const properties=['opacity','translate','will-change'];
 const finish=record=>{
  if(record.state==='done')return;
  record.state='done';record.playback?.stop();record.element.classList.remove('reveal-pending');
  for(const property of properties){
   const original=record.original[property];
   if(original)record.element.style.setProperty(property,original);
   else record.element.style.removeProperty(property);
  }
 };
 const reveal=record=>{
  if(record.state!=='pending')return;
  record.state='playing';observer.unobserve(record.element);
  try{
   record.playback=window.Motion.animate(record.element,{opacity:[0,1],translate:[`0px ${record.distance}px`,'0px 0px']},
    {duration:.56,delay:record.delay,ease:[.22,1,.36,1]});
   record.playback.finished.then(()=>finish(record),()=>finish(record));
  }catch{finish(record);}
 };
 const observer=new IntersectionObserver(entries=>{
  const activeRoot=compact.matches?mobile:desktop;
  for(const entry of entries){const record=records.get(entry.target);if(entry.isIntersecting&&record?.root===activeRoot)reveal(record);}
 },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
 for(const [name,root]of Object.entries({desktop,mobile}))for(const group of groups){
  group[name].forEach((selector,index)=>{
   const element=root.querySelector(selector);if(!element||records.has(element))return;
   const record={root,element,state:'pending',distance:name==='mobile'?16:20,delay:(group.stagger||0)*index,
    original:Object.fromEntries(properties.map(property=>[property,element.style.getPropertyValue(property)]))};
   records.set(element,record);element.classList.add('reveal-pending');observer.observe(element);
  });
 }
 const showAll=()=>{observer.disconnect();records.forEach(finish);};
 const onPreference=()=>{if(reduced.matches)showAll();};
 const onFocus=event=>{
  for(const record of records.values())if(record.state!=='done'&&record.element.contains(event.target)){observer.unobserve(record.element);finish(record);}
 };
 reduced.addEventListener('change',onPreference);document.addEventListener('focusin',onFocus);
 return()=>{showAll();reduced.removeEventListener('change',onPreference);document.removeEventListener('focusin',onFocus);};
}
