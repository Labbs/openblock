/**
 * Image node specification.
 *
 * Represents an image block with src, alt, caption and alignment.
 *
 * @module
 */

import type { NodeSpec } from 'prosemirror-model';

import { getBlockIdAttrs, blockIdToDOM, safeParseInt } from '../blockIdAttrs';
import { sanitizeImageSrc } from '../sanitizeUrl';

export type ImageAlignment = 'left' | 'center' | 'right';

export const imageNode: NodeSpec = {
  group: 'block',
  // Image is atomic - no editable content inside
  atom: true,
  draggable: true,
  attrs: {
    id: { default: null },
    src: { default: '' },
    alt: { default: '' },
    caption: { default: '' },
    width: { default: null as number | null },
    alignment: { default: 'center' as ImageAlignment },
  },
  parseDOM: [
    {
      tag: 'figure.openblock-image',
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        const img = element.querySelector('img');
        return {
          ...getBlockIdAttrs(element),
          // Unsafe srcs (e.g. javascript:) are dropped - placeholder is shown
          src: sanitizeImageSrc(img?.getAttribute('src')) ?? '',
          alt: img?.getAttribute('alt') || '',
          caption: element.querySelector('figcaption')?.textContent || '',
          width: safeParseInt(img?.getAttribute('data-width'), null),
          alignment: element.getAttribute('data-alignment') || 'center',
        };
      },
    },
    {
      tag: 'img[src]',
      getAttrs: (dom) => {
        const element = dom as HTMLImageElement;
        const src = sanitizeImageSrc(element.getAttribute('src'));
        // Reject standalone images with unsafe srcs entirely
        if (src === null) return false;
        return {
          src,
          alt: element.getAttribute('alt') || '',
          width: element.width || null,
        };
      },
    },
  ],
  toDOM: (node) => {
    const { alt, caption, width, alignment } = node.attrs;
    // Attrs can come from JSON (not only parseDOM), so re-validate here.
    const src = sanitizeImageSrc(node.attrs.src) ?? '';

    const figureAttrs: Record<string, string> = {
      class: `openblock-image openblock-image--${alignment}`,
      ...blockIdToDOM(node),
      'data-alignment': alignment,
    };

    // If no (safe) src, show a placeholder
    if (!src) {
      const placeholderDiv = [
        'div',
        { class: 'openblock-image-placeholder' },
        ['span', { class: 'openblock-image-placeholder-icon' }],
        ['span', { class: 'openblock-image-placeholder-text' }, 'Click to add an image'],
      ] as const;

      if (caption) {
        return ['figure', figureAttrs, placeholderDiv, ['figcaption', {}, caption]];
      }
      return ['figure', figureAttrs, placeholderDiv];
    }

    const imgAttrs: Record<string, string> = { src, alt };
    if (width) {
      imgAttrs['data-width'] = String(width);
      imgAttrs.style = `width: ${width}px`;
    }

    if (caption) {
      return [
        'figure',
        figureAttrs,
        ['img', imgAttrs],
        ['figcaption', {}, caption],
      ];
    }

    return ['figure', figureAttrs, ['img', imgAttrs]];
  },
};
