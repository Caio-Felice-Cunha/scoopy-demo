import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, createScoop, filterCatalog, scoopTotal } from '../site/catalog.mjs';

test('catalog is synthetic and contains no remote source fields', () => {
  assert.ok(catalog.length >= 15);
  assert.equal(catalog.some((item) => 'url' in item || 'image' in item || 'source' in item), false);
  assert.equal(JSON.stringify(catalog).includes('http'), false);
});

test('filters combine and return only matching products', () => {
  const result = filterCatalog(catalog, { category: 'tops', color: 'blue', style: 'bold' });
  assert.deepEqual(result.map((item) => item.id), ['cobalt-knit']);
});

test('scoop selection is deterministic and totals prices', () => {
  const one = createScoop(catalog, 5, 'coastal');
  const two = createScoop(catalog, 5, 'coastal');
  assert.deepEqual(one, two);
  assert.equal(one.length, 5);
  assert.ok(scoopTotal(one) > 0);
});
