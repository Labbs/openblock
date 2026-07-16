/**
 * useClickOutside - Invoke a callback when the user clicks outside given elements.
 *
 * Attaches a single `mousedown` listener on the document (only while
 * `enabled` is true). The callback and refs are read through refs, so the
 * listener is never re-attached when they change.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useClickOutside([containerRef], () => setIsOpen(false), isOpen);
 * ```
 *
 * @module
 */

import { useEffect, useRef } from 'react';

/**
 * Options for useClickOutside.
 */
export interface UseClickOutsideOptions {
  /**
   * CSS selectors treated as "inside": if the click target (or one of its
   * ancestors) matches any of these selectors, the callback is not invoked.
   * Useful for elements rendered in portals or managed outside React.
   */
  ignoreSelectors?: string[];

  /**
   * Defer attaching the listener to the next animation frame.
   * Useful when the popover is opened by a click, to avoid the opening
   * interaction being treated as an outside click.
   * @default false
   */
  defer?: boolean;
}

/**
 * Call `onOutside` when a mousedown happens outside all the given refs
 * (and outside any element matching `options.ignoreSelectors`).
 *
 * @param refs - Refs to elements considered "inside" (undefined entries are skipped)
 * @param onOutside - Callback invoked with the mousedown event
 * @param enabled - Whether the listener is active
 * @param options - Additional options (ignored selectors, deferred attach)
 */
export function useClickOutside(
  refs: ReadonlyArray<React.RefObject<Element | null> | undefined>,
  onOutside: (event: MouseEvent) => void,
  enabled: boolean,
  options: UseClickOutsideOptions = {}
): void {
  const { defer = false } = options;

  // Keep moving values in refs so the document listener stays stable.
  const refsRef = useRef(refs);
  refsRef.current = refs;
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;
  const ignoreSelectorsRef = useRef(options.ignoreSelectors);
  ignoreSelectorsRef.current = options.ignoreSelectors;

  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      for (const ref of refsRef.current) {
        if (ref?.current && ref.current.contains(target)) {
          return;
        }
      }

      const selectors = ignoreSelectorsRef.current;
      if (selectors && selectors.length > 0) {
        const element =
          target instanceof Element ? target : target.parentElement;
        if (element && selectors.some((selector) => element.closest(selector))) {
          return;
        }
      }

      onOutsideRef.current(event);
    };

    let frameId: number | null = null;
    if (defer) {
      frameId = requestAnimationFrame(() => {
        frameId = null;
        document.addEventListener('mousedown', handleMouseDown);
      });
    } else {
      document.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enabled, defer]);
}
