/**
 * Check list (todo list) node specifications.
 *
 * A list with checkable items for task tracking.
 *
 * @module
 */

import type { NodeSpec } from 'prosemirror-model';

import { blockIdAttr, getBlockIdAttrs, blockIdToDOM } from '../blockIdAttrs';

/**
 * Check list container node.
 */
export const checkListNode: NodeSpec = {
  group: 'block',
  content: 'checkListItem+',
  attrs: {
    ...blockIdAttr(),
  },
  parseDOM: [
    {
      tag: 'ul.openblock-checklist',
      // Must win over bulletList's plain 'ul' rule (default priority 50),
      // otherwise checklists degrade to bullet lists on copy/paste.
      priority: 60,
      getAttrs: (dom) => getBlockIdAttrs(dom as HTMLElement),
    },
  ],
  toDOM: (node) => [
    'ul',
    {
      class: 'openblock-checklist',
      ...blockIdToDOM(node),
    },
    0,
  ],
};

/**
 * Check list item node with a checkbox.
 */
export const checkListItemNode: NodeSpec = {
  content: 'inline*',
  attrs: {
    ...blockIdAttr(),
    checked: { default: false },
  },
  parseDOM: [
    {
      tag: 'li.openblock-checklist-item',
      // Must win over listItem's plain 'li' rule (default priority 50)
      priority: 60,
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        return {
          ...getBlockIdAttrs(element),
          checked: checkbox?.checked || element.getAttribute('data-checked') === 'true',
        };
      },
    },
  ],
  toDOM: (node) => [
    'li',
    {
      class: `openblock-checklist-item ${node.attrs.checked ? 'openblock-checklist-item--checked' : ''}`,
      ...blockIdToDOM(node),
      'data-checked': String(node.attrs.checked),
    },
    [
      'label',
      { class: 'openblock-checklist-label', contenteditable: 'false' },
      [
        'input',
        {
          type: 'checkbox',
          class: 'openblock-checklist-checkbox',
          ...(node.attrs.checked ? { checked: 'checked' } : {}),
        },
      ],
    ],
    ['span', { class: 'openblock-checklist-content' }, 0],
  ],
  // Allow dragging the entire item
  draggable: false,
};
