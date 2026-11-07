import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

import pkg from './package.json' with { type: 'json' };

/**
 * Library build for bundlers / Node: ESM (`index.js`) + CommonJS
 * (`index.cjs`), with every dependency left external, plus a single bundled
 * `index.d.ts`.
 *
 * The self-contained browser bundles are built by `vite.standalone.config.ts`.
 */
const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
];

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: resolve(import.meta.dirname, 'tsconfig.json'),
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rolldownOptions: {
      // Also externalize deep imports (e.g. 'prosemirror-view/style/...')
      external: (id) => external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: false,
    // Minify the CSS inlined by `editor.css?inline` (JS stays unminified)
    cssMinify: true,
  },
});
