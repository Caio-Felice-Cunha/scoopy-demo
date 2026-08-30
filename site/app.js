import { catalog, createScoop, filterCatalog, scoopTotal } from './catalog.mjs';

const form = document.querySelector('#filters');
const catalogGrid = document.querySelector('#catalog');
const count = document.querySelector('#match-count');
const result = document.querySelector('#scoop-result');
const waitlist = document.querySelector('#waitlist');
const status = document.querySelector('#status');

function filters() {
  return Object.fromEntries(new FormData(form));
}

function renderCatalog() {
  const matches = filterCatalog(catalog, filters());
  count.textContent = `${matches.length} fictional pieces match`;
  catalogGrid.innerHTML = matches.length ? matches.map(card).join('') : '<p class="empty">No pieces match this mix. Reset one filter and scoop again.</p>';
  return matches;
}

function card(item) {
  return `<article class="product-card"><span class="product-icon" aria-hidden="true">${item.icon}</span><div><p class="product-meta">${item.category} · ${item.style}</p><h3>${item.name}</h3><p>$${item.price} demo price</p></div></article>`;
}

form.addEventListener('change', renderCatalog);
document.querySelector('#scoop').addEventListener('click', () => {
  const selected = renderCatalog();
  if (!selected.length) {
    result.innerHTML = '<p class="empty">Nothing to scoop yet. Try a broader mix.</p>';
    result.focus();
    return;
  }
  const values = filters();
  const scoop = createScoop(selected, values.size, `${values.theme}:${values.category}:${values.color}:${values.style}`);
  result.innerHTML = `<div class="result-copy"><p class="eyebrow">${values.theme} scoop</p><h3>Your edit is ready.</h3><p>${scoop.length} fictional pieces · $${scoopTotal(scoop)} demo total</p></div><div class="scoop-stack">${scoop.map(card).join('')}</div>`;
  result.focus();
});
document.querySelector('#reset').addEventListener('click', () => {
  form.reset(); renderCatalog(); result.innerHTML = '<p class="result-placeholder">Your scoop will land here.</p>';
});
waitlist.addEventListener('submit', (event) => {
  event.preventDefault();
  waitlist.reset();
  status.textContent = 'Demo complete — your email was not stored or sent.';
});

renderCatalog();
