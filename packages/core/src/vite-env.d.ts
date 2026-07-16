/// <reference types="vite/client" />

/**
 * Vite `?inline` CSS imports resolve to the stylesheet content as a string.
 * Declared here so `tsc --noEmit` accepts `import css from './editor.css?inline'`.
 */
declare module '*.css?inline' {
  const css: string;
  export default css;
}
