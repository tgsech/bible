import { useCallback, useRef } from "react";

// Same idea as useLongPress's gesture-unification, but for word processor
// mode: single click/tap moves the caret (see VerseRow's onCharClick) or
// simply refocuses the verse, so bookmarking needs a *second*, deliberate
// gesture instead of the plain single click/long-press useLongPress uses
// when that mode is off. Native double-click timing is ~300-500ms; we use
// a slightly tighter window since a real double-click/double-tap is
// usually much faster than that ceiling anyway, and a tighter window
// leaves less chance of two genuinely separate single clicks (e.g. two
// quick caret repositions) misfiring as one bookmark toggle.
const DOUBLE_TAP_MS = 300;

// If a touch moves more than this many px between the two taps, they're
// not really "the same spot" (e.g. someone scrolling and incidentally
// tapping twice) - treat it as two singles instead of a double.
const MOVE_CANCEL_PX = 24;

export interface DoubleTapHandlers {
  onClick: (e: React.MouseEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Unifies "double-click on desktop" and "double-tap on mobile" into one
 * onActivate callback. Unlike useLongPress, this never calls
 * preventDefault/suppresses the underlying single click - callers that
 * also want single-click behavior (e.g. VerseRow's onCharClick for
 * caret placement) get both: the single click fires immediately and
 * normally, and onActivate fires only if a second one lands inside the
 * window.
 */
export function useDoubleTap(onActivate: () => void, enabled: boolean): DoubleTapHandlers {
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const registerTap = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      const last = lastTapRef.current;
      if (last && now - last.time <= DOUBLE_TAP_MS && Math.hypot(x - last.x, y - last.y) <= MOVE_CANCEL_PX) {
        lastTapRef.current = null;
        onActivate();
        return;
      }
      lastTapRef.current = { time: now, x, y };
    },
    [onActivate]
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      registerTap(e.clientX, e.clientY);
    },
    [enabled, registerTap]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      registerTap(touch.clientX, touch.clientY);
    },
    [enabled, registerTap]
  );

  return { onClick, onTouchEnd };
}
