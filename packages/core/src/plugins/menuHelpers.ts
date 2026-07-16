/**
 * Internal helpers shared by the menu plugins (bubble menu, media menu).
 *
 * Not part of the public API — intentionally not re-exported from
 * `plugins/index.ts`.
 *
 * @module
 */

import { PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

/**
 * Tracks a pending blur-hide timer and whether the owning plugin view
 * has been destroyed, so the timer callback never dispatches on a
 * destroyed view.
 */
export interface BlurHideHandle {
  /** Pending timer id, or null when no hide is scheduled. */
  timer: ReturnType<typeof setTimeout> | null;
  /** Set to true when the plugin view is destroyed. */
  destroyed: boolean;
}

/**
 * Create a fresh blur-hide handle.
 */
export function createBlurHideHandle(): BlurHideHandle {
  return { timer: null, destroyed: false };
}

/**
 * Schedule hiding a menu after the editor loses focus, unless focus moved
 * into one of the given menu containers. The delay lets clicks on menu
 * buttons register before the menu is hidden.
 *
 * @param view - The editor view
 * @param pluginKey - Key of the plugin whose `{ hide: true }` meta hides the menu
 * @param handle - Blur-hide handle owned by the plugin
 * @param keepOpenSelectors - CSS selectors; if focus lands inside a matching
 *   element the menu stays open
 * @param delay - Delay in ms before hiding
 */
export function scheduleHideOnBlur(
  view: EditorView,
  pluginKey: PluginKey,
  handle: BlurHideHandle,
  keepOpenSelectors: string[],
  delay: number
): void {
  if (handle.timer !== null) {
    clearTimeout(handle.timer);
  }
  handle.timer = setTimeout(() => {
    handle.timer = null;
    if (handle.destroyed) return;

    const activeElement = document.activeElement;
    const focusInMenu = keepOpenSelectors.some(
      (selector) => !!activeElement?.closest(selector)
    );

    if (!view.hasFocus() && !focusInMenu) {
      view.dispatch(view.state.tr.setMeta(pluginKey, { hide: true }));
    }
  }, delay);
}

/**
 * Clear any pending blur-hide timer and mark the handle destroyed.
 * Call from the plugin view's `destroy()`.
 */
export function disposeBlurHideHandle(handle: BlurHideHandle): void {
  if (handle.timer !== null) {
    clearTimeout(handle.timer);
    handle.timer = null;
  }
  handle.destroyed = true;
}
