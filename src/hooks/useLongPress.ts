import { useCallback, useRef } from "react";

// How long a touch has to be held before it counts as "long press" rather
// than a scroll/tap-through. Long enough that scrolling past a verse never
// triggers it, short enough that it doesn't feel unresponsive.
const LONG_PRESS_MS = 500;

// If a touch moves more than this many px before LONG_PRESS_MS elapses,
// it's a scroll gesture, not a long-press - cancel the timer. Verses can be
// long enough to need scrolling, so this has to be generous enough not to
// cancel on a finger that's basically holding still but trembles a pixel
// or two, while still catching a real scroll early.
const MOVE_CANCEL_PX = 10;

export interface LongPressHandlers {
  onClick: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Unifies "click on desktop" and "long-press on mobile" into one
 * `onActivate` callback, per the product decision that verse bookmarking
 * should feel the same idea on both: a single click on PC, a deliberate
 * long-press on touch (so a normal tap-to-scroll or tap-to-focus-the-typing-
 * input doesn't accidentally fire it).
 *
 * Touch devices fire a synthetic `click` after `touchend` - without
 * suppressing that, a long-press would immediately fire onActivate a
 * *second* time from the trailing click. touchFiredRef guards against that
 * for the same gesture; it's reset on the next touchstart, not on a timer,
 * so it can't accidentally swallow a genuine follow-up tap.
 */
export function useLongPress(onActivate: () => void, enabled: boolean): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const touchFiredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      // Swallow the synthetic click that follows a successful long-press's
      // touchend - onActivate already ran for this gesture.
      if (touchFiredRef.current) {
        touchFiredRef.current = false;
        return;
      }
      e.preventDefault();
      onActivate();
    },
    [enabled, onActivate]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      touchFiredRef.current = false;
      const touch = e.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => {
        touchFiredRef.current = true;
        onActivate();
      }, LONG_PRESS_MS);
    },
    [enabled, onActivate, clearTimer]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !startRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startRef.current.x;
      const dy = touch.clientY - startRef.current.y;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
        clearTimer();
      }
    },
    [enabled, clearTimer]
  );

  const onTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  return { onClick, onTouchStart, onTouchMove, onTouchEnd };
}
