/**
 * Shared SVG icons.
 *
 * Only icons that are duplicated across multiple components live here.
 * Each icon accepts standard SVG props (className, width, height, ...).
 *
 * @module
 */

import React from 'react';

/**
 * Link (chain) icon.
 * Used by BubbleMenu, LinkPopover and MediaMenu.
 */
export function LinkIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/**
 * Blockquote icon.
 * Used by SlashMenu and BubbleMenu.
 */
export function QuoteIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4" />
    </svg>
  );
}

/**
 * Plus icon.
 * Used by TableHandles for the add row/column buttons and menus.
 */
export function PlusIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
