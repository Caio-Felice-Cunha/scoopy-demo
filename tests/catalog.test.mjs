import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrandConfig, catalog, deterministicScoop, themeBlueprints } from '../site/catalog.mjs';

test('catalog contains exactly 221 unique synthetic items across 12 themes', () => {
  assert.equal(catalog.length, 221);
  assert.equal(themeBlueprints.length, 12);
  assert.equal(new Set(catalog.map((item) => item.id)).size, 221);
  assert.deepEqual(new Set(catalog.map((item) => item.theme)), new Set(themeBlueprints.map((theme) => theme.key)));
  assert.equal(catalog.every((item) => item.synthetic === true), true);
});

test('catalog contains no remote or retailer fields', () => {
  assert.equal(catalog.some((item) => 'url' in item || 'image' in item || 'source' in item), false);
  assert.equal(/https?:\/\/|sanrio|aliexpress|amazon/i.test(JSON.stringify(catalog)), false);
});

test('same theme, tier, and seed produce the same scoop', () => {
  const themeItems = catalog.filter((item) => item.theme === 'Cozy Critters');
  const first = deterministicScoop(themeItems, 7, 'Cozy Critters:Scoopy Scoop');
  const second = deterministicScoop(themeItems, 7, 'Cozy Critters:Scoopy Scoop');
  assert.deepEqual(first, second);
  assert.equal(first.length, 7);
});

test('brand configuration truthfully reflects generated data', () => {
  const config = buildBrandConfig();
  assert.equal(config.brand, 'Scoopy');
  assert.equal(config.totalProducts, 221);
  assert.equal(config.themeCount, 12);
  assert.equal(config.themes.reduce((sum, theme) => sum + theme.count, 0), 221);
});
