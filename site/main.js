import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-500.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/playfair-display/latin-500.css';
import '@fontsource/playfair-display/latin-500-italic.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-700.css';
import '@fontsource/allura/latin-400.css';
import './data/products.js';
import './app.js';

if (window.__scoopMode === 'auto') {
  import('./scoop3d.js').catch(() => {
    window.__scoopMode = 'none';
    window.__scoopBooted = false;
    document.documentElement.classList.remove('boot-pending');
  });
}
