/**
 * usePluginState - Subscribe to a ProseMirror plugin's state.
 *
 * Uses `useSyncExternalStore` so the component only re-renders when the
 * plugin state reference actually changes (ProseMirror plugins return the
 * previous state object from `apply()` when nothing changed, which lets
 * React bail out of the update entirely).
 *
 * @example
 * ```tsx
 * import { usePluginState } from '@labbs/openblock-react';
 * import { BUBBLE_MENU_PLUGIN_KEY } from '@labbs/openblock-core';
 *
 * function MyMenu({ editor }) {
 *   const menuState = usePluginState(editor, BUBBLE_MENU_PLUGIN_KEY);
 *   if (!menuState?.visible) return null;
 *   // ...
 * }
 * ```
 *
 * @module
 */

import { useCallback, useSyncExternalStore } from 'react';
import type { OpenBlockEditor, PluginKey } from '@labbs/openblock-core';

/**
 * Subscribe to the state of a ProseMirror plugin.
 *
 * @param editor - The OpenBlockEditor instance (can be null during initialization)
 * @param pluginKey - The plugin key to read state from
 * @returns The current plugin state, or null if unavailable
 */
export function usePluginState<T>(
  editor: OpenBlockEditor | null,
  pluginKey: PluginKey<T>
): T | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editor || editor.isDestroyed) {
        return () => {};
      }
      return editor.on('transaction', onStoreChange);
    },
    [editor]
  );

  const getSnapshot = useCallback((): T | null => {
    if (!editor || editor.isDestroyed) {
      return null;
    }
    return pluginKey.getState(editor.pm.state) ?? null;
  }, [editor, pluginKey]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
