import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {test} from 'node:test';

const output = new URL('../dist/', import.meta.url);
const headers = await fs.readFile(new URL('_headers', output), 'utf8');
const rules = headers.trim().split(/\n\s*\n/).map(block => {
  const [pattern, ...lines] = block.split('\n');
  const escaped = pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return {pattern, matches: new RegExp(`^${escaped.join('.*')}$`), lines};
});
const assets = await fs.readdir(new URL('assets/', output));

test('generated headers stay within Cloudflare limits', () => {
  assert.ok(rules.length <= 100, `${rules.length} header rules exceeds the limit of 100`);
  for (const line of headers.split('\n')) assert.ok(line.length <= 2000);
  for (const rule of rules) {
    assert.ok(rule.pattern.startsWith('/'));
    assert.ok((rule.pattern.match(/\*/g) ?? []).length <= 1);
  }
});

test('each built asset gets one appropriate cache policy', () => {
  assert.ok(assets.length > 0);
  for (const file of assets) {
    const matching = rules.filter(rule => rule.matches.test(`/assets/${file}`));
    assert.equal(matching.length, 1, `${file} must match exactly one cache rule`);
    const hashed = /-[a-f0-9]{10}\.(webp|png)$/.test(file);
    const policy = hashed
      ? '  Cache-Control: public, max-age=31536000, immutable'
      : '  Cache-Control: public, max-age=86400';
    assert.deepEqual(matching[0].lines, [policy], `${file} has an incorrect cache policy`);
  }
});

test('mutable HTML, CSS and JavaScript keep Cloudflare default revalidation', () => {
  for (const file of ['/', '/index.html', '/styles.css', '/fonts.css', '/interactions.js', '/vendor/framer-motion-dom-mini.js']) {
    assert.ok(!rules.some(rule => rule.matches.test(file)), `${file} must not get asset caching`);
  }
});
