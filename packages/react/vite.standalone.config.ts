import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Browser ESM bundle: `dist/standalone/openblock-react.esm.js`, minified.
 *
 * React (`react`, `react-dom/client`, `react/jsx-runtime`) and
 * `@labbs/openblock-core` stay as bare imports, to be resolved by an import
 * map. Mapping `@labbs/openblock-core` to the core standalone bundle keeps a
 * single copy of ProseMirror on the page (required for `instanceof` checks
 * on selections, nodes, etc.).
 */
const external = ['react', 'react-dom', '@labbs/openblock-core'];

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist/standalone',
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'openblock-react.esm.js',
    },
    rolldownOptions: {
      external: (id) => external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: {
        // Vite keeps whitespace in ES library output (for downstream
        // tree-shaking); a standalone file should be fully minified.
        minify: true,
      },
    },
    sourcemap: true,
    minify: true,
  },
});
