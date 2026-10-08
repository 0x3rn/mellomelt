import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

// Widths are the existing Figma image boxes, before the page's CSS zoom.
// Heights are needed for cover images: a tall crop requires more source pixels.
const slots = {
  n3:[1440,993],n27:[447,558],n29:[447,558],n31:[434,542],n34:[1477,983],
  n45:[249,266],n54:[249,266],n63:[249,266],n92:[400,533],n94:[400,263],
  n107:[400,816],n168:[278,310.4935],n180:[1240,465],n203:[1240,697.14],
  n226:[692,465],n263:[300,318],n265:[272.8,289.16],n267:[319,341],
  n275:[70,105],n285:[105,126],n295:[136.56,91.03],
  n378:[410.89,435.52],n380:[373.64,396.03],n382:[436.67,467.3],
  n385:[375,649],n388:[126.094,157.406],n390:[126.094,157.406],n392:[122.453,152.859],
  n410:[375,250],n420:[150,160],n429:[150,160],n438:[150,160],n468:[343,448],
  n475:[343,263],n481:[343,449],n544:[150,217],n556:[343,321],n578:[343,647.656],
  n627:[343,465],n637:[130.969,138.813],n639:[119.094,126.234],n641:[139.188,148.938],
  n649:[70,136],n660:[105,144],n671:[136.563,104.047],
  n753:[145.672,154.406],n755:[132.469,140.406],n757:[154.813,165.672],n1149:[292,194.673],
};
const coverClasses=new Set(['n3','n385','n45','n54','n63','n420','n429','n438','n92','n94','n107','n468','n475','n481','n180','n556','n226','n627']);
const heroes=new Set(['n3','n27','n29','n31','n34','n385','n388','n390','n392','n410']);
const emptyImage='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export async function optimizeImages(root,output,html){
  const source=path.join(root,'public/assets');
  const cache=path.join(root,'.cache/images');
  const assets=path.join(output,'assets');
  await fs.mkdir(cache,{recursive:true});
  await fs.mkdir(assets,{recursive:true});
  const manifest={};let originalBytes=0,optimizedBytes=0;
  for(const name of await fs.readdir(source)){
    if(!name.endsWith('.png')){await fs.copyFile(path.join(source,name),path.join(assets,name));continue;}
    const input=await fs.readFile(path.join(source,name));
    const metadata=await sharp(input).metadata();
    const hash=createHash('sha256').update(input).update('webp-quality92-v1').digest('hex').slice(0,10);
    const widths=[...new Set([160,320,480,640,960,1280,1600,1920].filter(w=>w<metadata.width).concat(metadata.width))];
    const candidates=[];
    for(const width of widths){
      const file=`${path.parse(name).name}-${width}-${hash}.webp`;
      const cached=path.join(cache,file);
      try{await fs.access(cached);}catch{
        await sharp(input).resize({width,withoutEnlargement:true})
          .webp({quality:92,alphaQuality:100,effort:4,smartSubsample:true}).toFile(cached);
      }
      await fs.copyFile(cached,path.join(assets,file));
      candidates.push(`./assets/${file} ${width}w`);
    }
    manifest[name]={srcset:candidates.join(', '),width:metadata.width,height:metadata.height};
    originalBytes+=input.length;
    optimizedBytes+=(await fs.stat(path.join(assets,candidates.at(-1).split('/').pop().split(' ')[0]))).size;
  }
  const faviconInput=await fs.readFile(path.join(source,'fc02e.png'));
  const faviconHash=createHash('sha256').update(faviconInput).digest('hex').slice(0,10);
  const favicon=`favicon-${faviconHash}.png`;
  await sharp(faviconInput).resize({width:32,height:32,fit:'contain',background:'#0000'}).png().toFile(path.join(assets,favicon));
  html=html.replace('href="./assets/fc02e.png"',`href="./assets/${favicon}"`);
  const heroPreloads=[];
  const mobileStart=html.indexOf('<div id="mobile">');
  const menuStart=html.indexOf('<template id="mobile-menu">');
  html=html.replace(/<img\b[^>]*>/g,(tag,offset)=>{
    const original=tag.match(/src="\.\/assets\/([^\"]+)"/);
    if(!original)return tag;
    const name=original[1],isMobile=offset>=mobileStart;
    const layout=isMobile?'(max-width: 700px)':'(min-width: 701px)';
    const className=tag.match(/class="([^\"]+)"/)[1];
    const image=manifest[name];
    const isHero=heroes.has(className)&&offset<menuStart;
    const priority=isHero||!image?'eager':'lazy';
    let sizes='',dimensions='',srcset=`./assets/${name}`;
    if(image){
      const slot=slots[className];
      if(!slot)throw Error(`Missing image slot: ${className}`);
      const width=coverClasses.has(className)?Math.max(slot[0],slot[1]*image.width/image.height):slot[0];
      sizes=isMobile?`${(width/375*100).toFixed(4)}vw`:`(max-width: 1440px) ${(width/1440*100).toFixed(4)}vw, ${width.toFixed(4)}px`;
      dimensions=` width="${image.width}" height="${image.height}" data-asset="${name}"`;
      srcset=image.srcset;
    }
    const type=image?'image/webp':'image/svg+xml';
    if(['n3','n385'].includes(className))heroPreloads.push(`<link rel="preload" as="image" type="${type}" media="${layout}" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high">`);
    const optimizedTag=tag.replace(original[0],`src="${emptyImage}"`)
      .replace(/\s*\/?\s*>$/,`${dimensions} loading="${priority}" decoding="async"${['n3','n385'].includes(className)?' fetchpriority="high"':''}>`);
    return `<picture class="responsive-image"><source media="${layout}" type="${type}" srcset="${srcset}"${sizes?` sizes="${sizes}"`:''}>${optimizedTag}</picture>`;
  });
  html=html.replace('<script src="./vendor/',`<script id="image-assets" type="application/json">${JSON.stringify(manifest)}</script><script src="./vendor/`);
  // Only the current layout's hero is preloaded. Never preload both versions.
  html=html.replace('</head>',heroPreloads.join('')+'</head>');
  return {html,originalBytes,optimizedBytes,manifest};
}
