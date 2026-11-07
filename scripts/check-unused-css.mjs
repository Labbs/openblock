#!/usr/bin/env node
/**
 * Dead CSS check: fails when the editor stylesheet defines class selectors
 * that no source file uses. Complements knip, which covers the TypeScript
 * side (unused files, exports, dependencies).
 *
 * A class counts as used when:
 * - its name appears as a whole word in a .ts / .tsx source file;
 * - it is a BEM modifier (`block--modifier`) of a used block, and the source
 *   builds that modifier dynamically: `block--${...}` or `${...}--modifier`;
 * - it is set by ProseMirror itself (`ProseMirror-*`).
 *
 * Usage: node scripts/check-unused-css.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const stylesheets = ['packages/core/src/styles/editor.css'];
const sourceDirs = ['packages/core/src', 'packages/react/src'];

function listSources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSources(path);
    return /\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [path] : [];
  });
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sources = sourceDirs
  .flatMap((dir) => listSources(join(root, dir)))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
const mentioned = (pattern) => new RegExp(pattern).test(sources);
const wordUsed = (name) => mentioned(`(?<![\\w-])${escape(name)}(?![\\w-])`);

function isUsed(cls) {
  if (/^ProseMirror(-|$)/.test(cls)) return true;
  if (wordUsed(cls)) return true;
  const sep = cls.indexOf('--');
  if (sep > 0) {
    const block = cls.slice(0, sep);
    const modifier = cls.slice(sep + 2);
    if (!wordUsed(block)) return false;
    return mentioned(`${escape(block)}--\\$\\{`) || mentioned(`\\}--${escape(modifier)}(?![\\w-])`);
  }
  return false;
}

let failed = false;
for (const sheet of stylesheets) {
  const css = readFileSync(join(root, sheet), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '') // comments
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, '""'); // strings (content: "...", url("..."))

  const classes = new Set();
  for (const [, selector] of css.matchAll(/([^{};]+)\{/g)) {
    if (selector.trim().startsWith('@')) continue; // @media / @keyframes params
    for (const [, cls] of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(cls);
  }

  const unused = [...classes].filter((cls) => !isUsed(cls)).sort();
  if (unused.length > 0) {
    failed = true;
    console.error(`${relative(root, join(root, sheet))}: ${unused.length} unused class(es)`);
    for (const cls of unused) console.error(`  .${cls}`);
  } else {
    console.log(`${sheet}: all ${classes.size} classes are used`);
  }
}

process.exit(failed ? 1 : 0);
