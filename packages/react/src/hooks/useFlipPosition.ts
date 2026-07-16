/**
 * useFlipPosition - Decide whether a dropdown/menu should open upward.
 *
 * Measures the floating element and the available space around its anchor,
 * and returns true when there is not enough space below but more space above.
 * Internal helper shared by BubbleMenu, SlashMenu and ColorPicker.
 *
 * @module
 */

import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Parameters for useFlipPosition.
 */
export interface UseFlipPositionParams {
  /** Whether the floating element is currently shown. */
  active: boolean;
  /** Ref to the floating element to measure. */
  elementRef: React.RefObject<HTMLElement | null>;
  /**
   * Returns the anchor rect (viewport coordinates). Read lazily inside a
   * layout effect, so it can safely measure DOM elements.
   */
  getAnchorRect: () => { top: number; bottom: number } | null;
  /** Fallback height when the element has not been measured yet. @default 300 */
  estimatedHeight?: number;
  /** Margin kept between the element and the viewport edges. @default 8 */
  margin?: number;
  /** Extra dependencies that should trigger a re-measure. */
  recomputeDeps?: readonly unknown[];
}

/**
 * Compute whether a floating element should open upward based on the
 * available space below/above its anchor.
 *
 * @returns true if the element should open upward
 */
export function useFlipPosition({
  active,
  elementRef,
  getAnchorRect,
  estimatedHeight = 300,
  margin = 8,
  recomputeDeps = [],
}: UseFlipPositionParams): boolean {
  const [openUpward, setOpenUpward] = useState(false);

  // Read the anchor lazily so the layout effect does not depend on the
  // (unstable) getter identity.
  const getAnchorRectRef = useRef(getAnchorRect);
  getAnchorRectRef.current = getAnchorRect;

  useLayoutEffect(() => {
    if (!active) return;

    const anchorRect = getAnchorRectRef.current();
    if (!anchorRect || !elementRef.current) return;

    const height = elementRef.current.offsetHeight || estimatedHeight;
    const spaceBelow = window.innerHeight - anchorRect.bottom - margin;
    const spaceAbove = anchorRect.top - margin;

    setOpenUpward(spaceBelow < height && spaceAbove > spaceBelow);
  }, [active, elementRef, estimatedHeight, margin, ...recomputeDeps]);

  return openUpward;
}
