import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'site',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        product: resolve(import.meta.dirname, 'site/index.html'),
        caseStudy: resolve(import.meta.dirname, 'site/case-study/index.html')
      }
    }
  }
});
