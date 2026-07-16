/**
 * Styles module.
 *
 * `editor.css` is the single source of truth for the editor styles.
 *
 * By default the editor injects these styles automatically into the document
 * head (see {@link injectStyles}, called by `Editor` unless the
 * `injectStyles: false` config option is set).
 *
 * If you prefer to manage CSS yourself (e.g. to let your bundler dedupe,
 * order, or post-process it), disable auto-injection and import the
 * stylesheet directly:
 *
 * ```typescript
 * import '@labbs/openblock-core/styles';
 *
 * const editor = new Editor({ injectStyles: false, ... });
 * ```
 *
 * @module
 */

export { injectStyles, removeStyles, areStylesInjected } from './injectStyles';
