#!/usr/bin/env node
/**
 * Post-build step shared by the packages (run from a package directory).
 *
 * - Copies the bundled `dist/index.d.ts` to `dist/index.d.cts` so CommonJS
 *   consumers (`require`) get declarations matching the `.cjs` build.
 * - Optionally copies a stylesheet to `dist/styles/` (`--css <path>`).
 *
 * Usage: node ../../scripts/finalize-build.mjs [--css src/styles/editor.css]
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const dts = join(dist, 'index.d.ts');

if (!existsSync(dts)) {
  console.error(`finalize-build: ${dts} not found - did the library build run?`);
  process.exit(1);
}
copyFileSync(dts, join(dist, 'index.d.cts'));

const cssFlag = process.argv.indexOf('--css');
if (cssFlag !== -1) {
  const css = process.argv[cssFlag + 1];
  if (!css || !existsSync(css)) {
    console.error(`finalize-build: stylesheet "${css}" not found`);
    process.exit(1);
  }
  const stylesDir = join(dist, 'styles');
  mkdirSync(stylesDir, { recursive: true });
  copyFileSync(css, join(stylesDir, basename(css)));
}
