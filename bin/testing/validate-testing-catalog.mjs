#!/usr/bin/env node
import { readFileSync } from 'node:fs';

export function validateCatalog(catalog) {
  if (catalog.families.length !== 15) throw new Error(`expected 15 families, got ${catalog.families.length}`);
  const ids = catalog.families.flatMap((family) => {
    if (family.recommendations.length !== 30) throw new Error(`${family.id}: expected 30 recommendations`);
    return family.recommendations.map((item) => {
      if (!item.title?.trim() || !item.directive?.trim()) throw new Error(`${item.id}: missing title or directive`);
      if (/apply catalog obligation|authorized testing prompt/i.test(`${item.title} ${item.directive}`)) throw new Error(`${item.id}: generic placeholder text`);
      return item.id;
    });
  });
  if (ids.length !== 450 || new Set(ids).size !== 450) throw new Error('catalog must contain 450 unique IDs');
  const titles = catalog.families.flatMap((family) => family.recommendations.map((item) => item.title));
  const directives = catalog.families.flatMap((family) => family.recommendations.map((item) => item.directive));
  const allowedSourceTitleCollisions = new Set(['Resource lifecycle']);
  const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index && !allowedSourceTitleCollisions.has(title));
  if (duplicateTitles.length > 0 || new Set(directives).size !== 450) throw new Error('titles and directives must be uniquely bound to IDs');
  for (let family = 1; family <= 15; family++) for (let item = 1; item <= 30; item++) {
    const id = `F${String(family).padStart(2, '0')}.${String(item).padStart(2, '0')}`;
    if (!ids.includes(id)) throw new Error(`missing ${id}`);
  }
  return { families: 15, recommendations: 450, unique: 450 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const catalog = JSON.parse(readFileSync(process.argv[2] ?? new URL('../../07-quality-and-verification/references/testing-catalog.json', import.meta.url), 'utf8'));
  process.stdout.write(`${JSON.stringify(validateCatalog(catalog))}\n`);
}
