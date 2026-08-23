import { useEffect } from "react";

// The problem this file solves: Element.scrollIntoView() computes "visible"
// against the *layout* viewport (window.innerHeight), not the *visual*
// viewport. On mobile, opening the software keyboard shrinks the visual
// viewport but most browsers leave window.innerHeight untouched - so
// scrollIntoView happily scrolls a verse to a spot it thinks is visible,
// which is actually sitting behind the keyboard. Everything below measures
// against window.visualViewport instead, which mobile browsers DO update
// live as the keyboard opens/closes/resizes.

const BOTTOM_MARGIN_PX = 24;
const TOP_MARGIN_PX = 16;

/**
 * Scrolls the page just far enough that `el` clears the visible (keyboard-
 * aware) viewport, instead of assuming the whole window is usable space.
 * Safe to call with no keyboard present too - visualViewport still exists
 * and just reports the same size as window.innerHeight in that case, so
 * this degrades to normal scrollIntoView-like behavior on desktop/tablet.
 */
export function scrollAboveKeyboard(el: Element | null, behavior: ScrollBehavior = "smooth") {
  if (!el) return;
  const vv = window.visualViewport;
  const rect = el.getBoundingClientRect();

  // visualViewport.offsetTop is how far the visual viewport's top edge sits
  // below the layout viewport's top edge (relevant on iOS Safari, where the
  // page can be scrolled such that browser chrome is partially hidden).
  const visibleTop = vv ? vv.offsetTop : 0;
  const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;

  if (rect.bottom > visibleBottom - BOTTOM_MARGIN_PX) {
    window.scrollBy({ top: rect.bottom - (visibleBottom - BOTTOM_MARGIN_PX), behavior });
  } else if (rect.top < visibleTop + TOP_MARGIN_PX) {
    window.scrollBy({ top: rect.top - (visibleTop + TOP_MARGIN_PX), behavior });
  }
}

/**
 * Scrolls `el`'s vertical center to the vertical center of the visible
 * (keyboard-aware) viewport, rather than only nudging it in once it nears
 * an edge. Used for the active-verse autoscroll in ChapterView, so the
 * verse being typed sits in the middle of the screen as you move through a
 * chapter instead of hugging the bottom edge above the keyboard. Same
 * visualViewport math as scrollAboveKeyboard, for the same reason (see file
 * comment above) - it needs to center against what's actually visible
 * above the on-screen keyboard, not the full layout viewport.
 */
export function centerInViewport(el: Element | null, behavior: ScrollBehavior = "smooth") {
  if (!el) return;
  const vv = window.visualViewport;
  const rect = el.getBoundingClientRect();

  const visibleTop = vv ? vv.offsetTop : 0;
  const visibleHeight = vv ? vv.height : window.innerHeight;
  const visibleCenter = visibleTop + visibleHeight / 2;
  const elCenter = rect.top + rect.height / 2;

  window.scrollBy({ top: elCenter - visibleCenter, behavior });
}

/**
 * Keeps a CSS variable (--keyboard-inset, in px) on <html> in sync with
 * however much of the bottom of the screen the on-screen keyboard is
 * currently covering. Components can add this as bottom padding/margin so
 * "the last bit of content" has genuine room to scroll above the keyboard
 * rather than being permanently stuck under it.
 */
export function useKeyboardInsetVar() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
}

/**
 * Re-runs `onKeyboardChange` whenever the visual viewport resizes (keyboard
 * opening/closing/resizing) or scrolls. Used to re-check "is the active
 * verse still visible?" at the moment the keyboard finishes animating in -
 * a single scrollAboveKeyboard() call made at focus time is often too early,
 * since the keyboard hasn't reached its final height yet.
 */
export function useOnVisualViewportChange(onKeyboardChange: () => void) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    vv.addEventListener("resize", onKeyboardChange);
    vv.addEventListener("scroll", onKeyboardChange);
    return () => {
      vv.removeEventListener("resize", onKeyboardChange);
      vv.removeEventListener("scroll", onKeyboardChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
