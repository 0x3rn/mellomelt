import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist');
await fs.mkdir(output, {recursive: true});
for (const file of ['index.html', 'styles.css', 'fonts.css', 'interactions.js']) {
  await fs.copyFile(path.join(root, 'src', file), path.join(output, file));
}
await fs.cp(path.join(root, 'public'), output, {recursive: true});
console.log('Built Mello Melt in dist.');
