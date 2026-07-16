/**
 * CSS Style Injection
 *
 * Auto-injects OpenBlock editor styles into the document head.
 * This allows the editor to work without requiring manual CSS imports.
 *
 * The styles are imported from `editor.css` (the single source of truth)
 * and inlined into the bundle at build time via Vite's `?inline` query.
 *
 * @module
 */

import EDITOR_STYLES from './editor.css?inline';

const STYLE_ID = 'openblock-styles';
let stylesInjected = false;

/**
 * Inject OpenBlock styles into the document head.
 *
 * This function is idempotent - calling it multiple times will only inject styles once.
 *
 * @returns true if styles were injected, false if they were already present
 *
 * @example
 * ```typescript
 * import { injectStyles } from '@openblock/core';
 *
 * // Automatically inject styles (called by editor by default)
 * injectStyles();
 * ```
 */
export function injectStyles(): boolean {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    return false;
  }

  // Don't inject twice
  if (stylesInjected || document.getElementById(STYLE_ID)) {
    stylesInjected = true;
    return false;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = EDITOR_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;

  return true;
}

/**
 * Remove injected OpenBlock styles from the document.
 *
 * Useful for cleanup in single-page applications or when unmounting the editor.
 *
 * @example
 * ```typescript
 * import { removeStyles } from '@openblock/core';
 *
 * // Clean up when done
 * removeStyles();
 * ```
 */
export function removeStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
    stylesInjected = false;
  }
}

/**
 * Check if OpenBlock styles have been injected.
 *
 * @returns true if styles are present in the document
 */
export function areStylesInjected(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return stylesInjected || !!document.getElementById(STYLE_ID);
}
