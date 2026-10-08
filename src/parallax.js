const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

// Distances use the design's pixels; the existing page zoom scales them on screen.
const designs={
 desktop:{hero:'.n2',layers:[
  ['.n3',.13,72,0,true],['.n27',-.055,32,-.7],['.n29',-.08,44,.8],['.n31',-.065,36,-.5],['.n34',.015,10,0],
 ],photos:[['.n92',22],['.n94',18],['.n107',26],['.n180',24],['.n226',22]],
 footer:[['.n378',18,-.7],['.n380',14,.6],['.n382',22,.5]]},
 mobile:{hero:'.n384',layers:[
  ['.n385',.10,32,0,true],['.n388',-.045,12,-.5],['.n390',-.065,18,.6],['.n392',-.05,14,-.4],['.n410',.012,6,0],
 ],photos:[['.n468',14],['.n475',12],['.n481',16],['.n556',14],['.n627',14]],
 footer:[['.n753',8,-.5],['.n755',6,.4],['.n757',10,.4]]},
};

export function setupParallax({desktop,mobile}){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const compact=window.matchMedia('(max-width:700px)');
 const scenes=[],visible=new Set();
 let frame=0,lastTime=0,disposed=false;
 const imageFrame=image=>image.closest('picture')?.parentElement||image.parentElement;
 const addScene=(root,element,layers,mode)=>{
  if(!element||!layers.length)return;
  const scene={root,element,layers,mode};scenes.push(scene);
  layers.forEach(layer=>{
   layer.image.classList.add('parallax-layer');layer.y=0;layer.angle=0;layer.ready=false;
  });
  return scene;
 };
 for(const [name,root]of Object.entries({desktop,mobile})){
  const design=designs[name],hero=root.querySelector(design.hero);
  const layers=design.layers.flatMap(([selector,rate,travel,tilt=0,cover=false])=>{
   const image=root.querySelector(selector);return image?[{image,rate,travel,tilt,cover}]:[];
  });
  if(addScene(root,hero,layers,'hero'))hero.classList.add('parallax-window');
  for(const [selector,travel]of design.photos){
   const image=root.querySelector(selector);if(!image)continue;
   const element=imageFrame(image);element.classList.add('parallax-window');
   addScene(root,element,[{image,travel,tilt:0,cover:true}],'photo');
  }
  for(const [selector,travel,tilt]of design.footer){
   const image=root.querySelector(selector);if(image)addScene(root,imageFrame(image),[{image,travel,tilt,cover:false}],'photo');
  }
 }
 const wake=()=>{if(!disposed&&!reduced.matches&&!document.hidden&&!frame)frame=requestAnimationFrame(update);};
 function update(time){
  frame=0;if(disposed||reduced.matches||document.hidden)return;
  const delta=lastTime?Math.min(64,time-lastTime):16;lastTime=time;
  const blend=1-Math.exp(-delta/90),viewport=window.innerHeight,activeRoot=compact.matches?mobile:desktop;
  const zoom=parseFloat(activeRoot.style.zoom)||1;
  // Read stable containers first, then write only image transforms.
  const measurements=[...visible].filter(scene=>scene.root===activeRoot).map(scene=>({scene,rect:scene.element.getBoundingClientRect()}));
  let settling=false;
  for(const {scene,rect}of measurements){
   if(!rect.height||rect.bottom<-150||rect.top>viewport+150)continue;
   const progress=clamp((viewport/2-rect.top-rect.height/2)/((viewport+rect.height)/2),-1,1);
   const distance=Math.max(0,-rect.top/zoom);
   for(const layer of scene.layers){
    const target=scene.mode==='hero'?clamp(distance*layer.rate,-layer.travel,layer.travel):progress*layer.travel;
    const angle=scene.mode==='hero'?clamp(distance/(rect.height/zoom),0,1)*layer.tilt:progress*layer.tilt;
    if(!layer.ready){layer.y=target;layer.angle=angle;layer.ready=true;}
    else{layer.y+=(target-layer.y)*blend;layer.angle+=(angle-layer.angle)*blend;}
    if(Math.abs(target-layer.y)>.02||Math.abs(angle-layer.angle)>.005)settling=true;
    else{layer.y=target;layer.angle=angle;}
    const scale=layer.cover?1+2*(layer.travel+2)/(rect.height/zoom):1;
    layer.image.style.setProperty('--parallax-y',`${layer.y.toFixed(3)}px`);
    layer.image.style.setProperty('--parallax-angle',`${layer.angle.toFixed(3)}deg`);
    layer.image.style.setProperty('--parallax-scale',scale.toFixed(5));
   }
  }
  if(settling)wake();else lastTime=0;
 }
 const intersection=new IntersectionObserver(entries=>{
  for(const entry of entries){
   const scene=scenes.find(item=>item.element===entry.target);if(!scene)continue;
   if(entry.isIntersecting)visible.add(scene);else visible.delete(scene);
   scene.layers.forEach(layer=>{layer.image.style.willChange=entry.isIntersecting&&!reduced.matches?'transform':'';});
  }
  wake();
 },{rootMargin:'150px 0px'});
 scenes.forEach(scene=>intersection.observe(scene.element));
 const resize=new ResizeObserver(wake);resize.observe(desktop);resize.observe(mobile);
 scenes.forEach(scene=>resize.observe(scene.element));
 const reset=()=>{
  cancelAnimationFrame(frame);frame=0;lastTime=0;
  for(const scene of scenes)for(const layer of scene.layers){
   layer.ready=false;layer.image.style.willChange='';
   for(const property of ['--parallax-y','--parallax-angle','--parallax-scale'])layer.image.style.removeProperty(property);
  }
  if(!disposed&&!reduced.matches){for(const scene of visible)scene.layers.forEach(layer=>{layer.image.style.willChange='transform';});wake();}
 };
 const onVisibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0;}else wake();};
 window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',wake);
 document.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',reset);compact.addEventListener('change',reset);
 document.fonts.ready.then(wake);
 return()=>{
  disposed=true;reset();intersection.disconnect();resize.disconnect();
  window.removeEventListener('scroll',wake);window.removeEventListener('resize',wake);
  document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',reset);compact.removeEventListener('change',reset);
 };
}
