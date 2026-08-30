# Scoopy — a tactile catalog discovery demo

![Scoopy interactive demo](./site/social-card.svg)

**A complete, privacy-safe product website that turns 221 synthetic stationery items into a deterministic themed scoop.**

[Try the demo](https://caio-felice-cunha.github.io/scoopy-demo/) · [Engineering case](https://caio-felice-cunha.github.io/scoopy-demo/case-study/) · [View source](https://github.com/Caio-Felice-Cunha/scoopy-demo) · [Run locally](#run-locally)

## What you can test

- Follow a six-chapter Three.js and GSAP product story, or its static fallback.
- Explore 12 collections containing exactly 221 generated, brand-free items.
- Choose a collection and tier, then reproduce the same deterministic scoop.
- Complete a demonstrative waitlist state that stores and transmits nothing.

## Engineering case

Scoopy explores a product question: can browsing feel less like searching a
warehouse and more like opening a tightly edited box? The approved visual
prototype established the complete narrative, collection, tier, builder, and
“Scoop it!” interaction. This repository publishes a clean implementation with
locally bundled dependencies and synthetic products.

No purchase is possible and the waitlist stores or sends nothing. The design
optimizes for a useful result in under a minute, keyboard use, and clear status
feedback instead of hidden data collection.

The navigable [engineering case](https://caio-felice-cunha.github.io/scoopy-demo/case-study/)
covers architecture, workflow, progressive enhancement, design tokens, real
code, tests, security boundaries, limitations, and local execution.

## Architecture

```text
generated catalog → collections + tiers → deterministic scoop → local-only result
capability gate   → optional 3D story     → accessible static fallback
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4174`. Run `npm run test:all` for unit, build, and browser tests.

## Limitations

- All products and prices are fictional.
- The waitlist is a UI demonstration and never persists an email.
- There is no checkout, inventory, recommendation backend, analytics, or account.
- Pickup, delivery, inventory, and prices are product-concept states.

## Security and licensing

Code is MIT licensed. Brand and authored assets have separate rights in
[BRAND-LICENSE.md](./BRAND-LICENSE.md). Bundled dependency licenses are listed
in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
