import fs from 'node:fs/promises';
import path from 'node:path';
import {optimizeImages} from './optimize-images.mjs';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist');
await fs.mkdir(output, {recursive: true});
for (const file of ['styles.css', 'fonts.css', 'interactions.js']) {
  await fs.copyFile(path.join(root, 'src', file), path.join(output, file));
}
const originalHTML=await fs.readFile(path.join(root,'src/index.html'),'utf8');
const optimized=await optimizeImages(root,output,originalHTML);
await fs.writeFile(path.join(output,'index.html'),optimized.html);
// Remove obsolete uncompressed build copies; source originals stay untouched.
const assets=path.join(output,'assets');
for(const file of await fs.readdir(assets)){
  if(file.endsWith('.png')&&!file.startsWith('favicon-'))await fs.unlink(path.join(assets,file));
}
const cachedAssets=(await fs.readdir(assets)).filter(file=>/-[a-f0-9]{10}\.(webp|png)$/.test(file));
await fs.writeFile(path.join(output,'_headers'),'/assets/*\n  Cache-Control: public, max-age=86400\n\n'+cachedAssets.map(file=>`/assets/${file}\n  Cache-Control: public, max-age=31536000, immutable\n`).join('\n'));
await fs.mkdir(path.join(output, 'vendor'), {recursive: true});
await fs.copyFile(
  path.join(root, 'node_modules/framer-motion/dist/dom-mini.js'),
  path.join(output, 'vendor/framer-motion-dom-mini.js'),
);
console.log(`Built Mello Melt in dist. Full-size raster images: ${(optimized.originalBytes/1e6).toFixed(2)} MB → ${(optimized.optimizedBytes/1e6).toFixed(2)} MB (${(100*(1-optimized.optimizedBytes/optimized.originalBytes)).toFixed(1)}% smaller).`);
