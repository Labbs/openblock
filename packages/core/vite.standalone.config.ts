import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Standalone browser bundles: everything (ProseMirror included) bundled
 * into a single minified file, usable without a bundler.
 *
 * - `dist/standalone/openblock-core.esm.js`  → `<script type="module">` / import maps
 * - `dist/standalone/openblock-core.iife.js` → classic `<script>`, exposes `window.OpenBlock`
 *
 * The editor CSS is inlined and injected automatically at runtime
 * (see `injectStyles`); `dist/styles/editor.css` remains available for
 * `injectStyles: false` setups.
 *
 * Collaboration (`yjs` / `y-prosemirror`) is not bundled: the editor only
 * receives already-created Y.js plugins through its config.
 */
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist/standalone',
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'OpenBlock',
      formats: ['es', 'iife'],
      fileName: (format) => `openblock-core.${format === 'es' ? 'esm' : 'iife'}.js`,
    },
    rolldownOptions: {
      output: {
        exports: 'named',
        // Vite keeps whitespace in ES library output (for downstream
        // tree-shaking); a standalone file should be fully minified.
        minify: true,
      },
    },
    sourcemap: true,
    minify: true,
    cssMinify: true,
  },
});
