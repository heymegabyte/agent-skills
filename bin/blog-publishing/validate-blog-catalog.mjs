#!/usr/bin/env node
import { readFileSync } from 'node:fs';

export function validateBlogCatalog(catalog) {
  if (catalog.categories.length !== 12) throw new Error(`expected 12 categories, got ${catalog.categories.length}`);
  const entries = catalog.categories.flatMap((category) => {
    if (category.recommendations.length !== 30) throw new Error(`${category.id}: expected 30 recommendations`);
    return category.recommendations;
  });
  const ids = entries.map((entry) => entry.id);
  const directives = entries.map((entry) => entry.directive.trim());
  if (ids.length !== 360 || new Set(ids).size !== 360) throw new Error('catalog must contain 360 unique IDs');
  if (new Set(directives).size !== 360) throw new Error('directives must be uniquely bound to IDs');
  for (const entry of entries) {
    if (!entry.directive || entry.directive.length < 20) throw new Error(`${entry.id}: missing directive`);
    if (/apply catalog obligation|authorized prompt|placeholder/i.test(entry.directive)) throw new Error(`${entry.id}: generic placeholder directive`);
  }
  for (let family = 0; family < 12; family++) for (let item = 1; item <= 30; item++) {
    const id = `${String.fromCharCode(65 + family)}${String(item).padStart(2, '0')}`;
    if (!ids.includes(id)) throw new Error(`missing ${id}`);
  }
  return { categories: 12, recommendations: 360, unique: 360 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2] ?? new URL('../../blog-publishing/references/blog-publishing-360-catalog.json', import.meta.url);
  const catalog = JSON.parse(readFileSync(path, 'utf8'));
  process.stdout.write(`${JSON.stringify(validateBlogCatalog(catalog))}\n`);
}
