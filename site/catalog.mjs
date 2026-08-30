const adjectivePool = Object.freeze([
  'Cloudberry', 'Velvet', 'Pocket', 'Dewdrop', 'Daydream', 'Honey',
  'Mochi', 'Twinkle', 'Sunday', 'Soft', 'Pebble', 'Little'
]);

const formatPool = Object.freeze([
  'Notebook', 'Memo Pad', 'Washi Roll', 'Gel Pen', 'Sticker Sheet',
  'Pencil Case', 'Page Marker', 'Mini Folder', 'Eraser Set', 'Desk Clip'
]);

export const themeBlueprints = Object.freeze([
  { key: 'Cozy Critters', emoji: '🐹', count: 40, launch: true, blurb: 'Warm, unhurried desk companions.', accent: 'Cocoa' },
  { key: 'Ribbon Club', emoji: '🎀', count: 33, launch: true, blurb: 'Bows, blush, and gift-wrap energy.', accent: 'Ribbon' },
  { key: 'Tiny Treats', emoji: '🍓', count: 28, launch: true, blurb: 'Small snacks reimagined as stationery.', accent: 'Berry' },
  { key: 'Quiet Desk', emoji: '🤍', count: 20, launch: false, blurb: 'Calm neutrals for focused days.', accent: 'Oat' },
  { key: 'Moonlight', emoji: '✨', count: 18, launch: false, blurb: 'Soft shimmer without the visual noise.', accent: 'Moon' },
  { key: 'Play Parade', emoji: '🎉', count: 17, launch: false, blurb: 'Colorful pieces that refuse to be serious.', accent: 'Confetti' },
  { key: 'Whiskers', emoji: '🐱', count: 15, launch: false, blurb: 'Paws, naps, and curious little faces.', accent: 'Purr' },
  { key: 'Garden Notes', emoji: '🌸', count: 12, launch: false, blurb: 'Botanical shapes and pressed-flower calm.', accent: 'Petal' },
  { key: 'Ballet Blush', emoji: '🩰', count: 11, launch: false, blurb: 'Soft pinks, ribbons, and graceful lines.', accent: 'Blush' },
  { key: 'Happy Pups', emoji: '🐶', count: 10, launch: false, blurb: 'Friendly dog sketches for cheerful desks.', accent: 'Pup' },
  { key: 'Old Library', emoji: '📚', count: 9, launch: false, blurb: 'Bookish details with warm, archival color.', accent: 'Archive' },
  { key: 'Carry Cute', emoji: '👜', count: 8, launch: false, blurb: 'Small organizers and cases for the whole scoop.', accent: 'Tote' }
]);

function hash32(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededOrder(items, seed) {
  return [...items].sort((left, right) =>
    hash32(`${seed}:${left.id ?? left}`) - hash32(`${seed}:${right.id ?? right}`));
}

export function createSyntheticCatalog() {
  return themeBlueprints.flatMap((theme, themeIndex) =>
    Array.from({ length: theme.count }, (_, itemIndex) => {
      const adjective = adjectivePool[(itemIndex + themeIndex * 3) % adjectivePool.length];
      const format = formatPool[(itemIndex * 3 + themeIndex) % formatPool.length];
      const edition = String(itemIndex + 1).padStart(2, '0');
      return Object.freeze({
        id: `${themeIndex + 1}-${edition}`,
        theme: theme.key,
        name: `${adjective} ${theme.accent} ${format} · ${edition}`,
        icon: theme.emoji,
        demoPrice: 4 + ((itemIndex * 7 + themeIndex * 5) % 18),
        synthetic: true
      });
    })
  );
}

export const catalog = Object.freeze(createSyntheticCatalog());

export function deterministicScoop(items, size, seed) {
  const count = Math.max(0, Math.min(Number(size) || 0, items.length));
  return seededOrder(items, seed).slice(0, count);
}

export const scoops = Object.freeze([
  { name: 'Mini Scoop', items: '4 demo surprises', price: '$14 demo', emoji: '🧁', desc: 'A small product-state preview.' },
  { name: 'Scoopy Scoop', items: '7 demo surprises', price: '$26 demo', emoji: '🎁', desc: 'The signature interaction.', featured: true },
  { name: 'Big Scoop', items: '13 demo surprises', price: '$42 demo', emoji: '💝', desc: 'A broader catalog rehearsal.' },
  { name: 'Premium Scoop', items: '10 + a hero piece', price: '$55 demo', emoji: '✨', desc: 'The full concept state.' }
]);

export function buildBrandConfig() {
  const themes = themeBlueprints.map((theme) => ({
    ...theme,
    samples: catalog.filter((item) => item.theme === theme.key).map((item) => item.name)
  }));
  return Object.freeze({
    brand: 'Scoopy',
    tagline: 'A little joy, scooped for you.',
    city: 'Vancouver',
    totalProducts: catalog.length,
    themeCount: themes.length,
    themes,
    scoops
  });
}
