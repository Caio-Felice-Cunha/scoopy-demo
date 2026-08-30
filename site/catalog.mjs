export const catalog = Object.freeze([
  { id: 'cloud-cardigan', name: 'Cloud Cardigan', icon: '☁️', category: 'layers', color: 'cream', style: 'soft', price: 42 },
  { id: 'cobalt-knit', name: 'Cobalt Knit', icon: '🌊', category: 'tops', color: 'blue', style: 'bold', price: 36 },
  { id: 'berry-tee', name: 'Berry Baby Tee', icon: '🍓', category: 'tops', color: 'pink', style: 'playful', price: 22 },
  { id: 'moss-vest', name: 'Moss Utility Vest', icon: '🌿', category: 'layers', color: 'green', style: 'utility', price: 48 },
  { id: 'midnight-skirt', name: 'Midnight Skirt', icon: '🌙', category: 'bottoms', color: 'black', style: 'soft', price: 39 },
  { id: 'sunny-trouser', name: 'Sunny Trouser', icon: '☀️', category: 'bottoms', color: 'yellow', style: 'bold', price: 44 },
  { id: 'ink-denim', name: 'Ink Wide Denim', icon: '🫐', category: 'bottoms', color: 'blue', style: 'utility', price: 55 },
  { id: 'rose-dress', name: 'Rose Slip Dress', icon: '🌹', category: 'dresses', color: 'pink', style: 'soft', price: 58 },
  { id: 'lime-dress', name: 'Lime Shift Dress', icon: '🍋', category: 'dresses', color: 'green', style: 'bold', price: 52 },
  { id: 'mono-dress', name: 'Mono Column Dress', icon: '♟️', category: 'dresses', color: 'black', style: 'minimal', price: 62 },
  { id: 'cream-cap', name: 'Cream Soft Cap', icon: '🧢', category: 'accessories', color: 'cream', style: 'playful', price: 18 },
  { id: 'orbit-bag', name: 'Orbit Mini Bag', icon: '🪐', category: 'accessories', color: 'black', style: 'bold', price: 31 },
  { id: 'leaf-scarf', name: 'Leaf Print Scarf', icon: '🍃', category: 'accessories', color: 'green', style: 'playful', price: 16 },
  { id: 'studio-shirt', name: 'Studio Poplin Shirt', icon: '📐', category: 'tops', color: 'cream', style: 'minimal', price: 46 },
  { id: 'pink-trench', name: 'Pink Short Trench', icon: '🌸', category: 'layers', color: 'pink', style: 'bold', price: 74 },
  { id: 'night-blazer', name: 'Night Box Blazer', icon: '🖤', category: 'layers', color: 'black', style: 'minimal', price: 78 },
  { id: 'sky-shorts', name: 'Sky Tailored Shorts', icon: '🦋', category: 'bottoms', color: 'blue', style: 'minimal', price: 34 },
  { id: 'lemon-tee', name: 'Lemon Rib Tee', icon: '✨', category: 'tops', color: 'yellow', style: 'playful', price: 24 }
]);

export function filterCatalog(items, filters) {
  return items.filter((item) => ['category', 'color', 'style'].every((key) => !filters[key] || filters[key] === 'all' || item[key] === filters[key]));
}

function hash(value) {
  return [...value].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);
}

export function createScoop(items, size, seed) {
  const count = Math.max(1, Math.min(Number(size) || 3, items.length));
  return [...items]
    .sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`))
    .slice(0, count);
}

export function scoopTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}
