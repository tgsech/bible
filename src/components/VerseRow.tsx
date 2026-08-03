import { memo, forwardRef } from "react";
import { charMatches, UNTYPED_MARKER } from "../typing/charMatch";
import { useLongPress } from "../hooks/useLongPress";
import { useDoubleTap } from "../hooks/useDoubleTap";

export type VerseStatus = "pending" | "active" | "done";

interface VerseRowProps {
  index: number;
  text: string;
  status: VerseStatus;
  typed?: string; // only meaningful when status === "active"
  isComposing?: boolean; // only meaningful when status === "active"
  language: string;
  // Whether this verse is currently bookmarked - drives the highlight +
  // underline (.bookmarkedVerse, see index.css). Undefined/false renders
  // as plain text, same as before bookmarking existed.
  isBookmarked?: boolean;
  // Fires on a desktop click or a mobile long-press of this verse (see
  // useLongPress.ts) - undefined means the gesture is fully disabled for
  // this row (e.g. guests, per the product decision that bookmarking
  // silently does nothing when signed out).
  onActivate?: () => void;
  // Word-processor mode's real cursor index, mirrored from the hidden
  // input's selectionStart (see ReadPage). null/undefined means "not in
  // word processor mode" - falls back to the classic typed.length-only
  // cursor with no click-to-position, same as before this feature existed.
  cursorPos?: number | null;
  // Fires when someone clicks a specific character in word processor
  // mode, with that character's index - ReadPage uses this to move the
  // hidden input's real selection there via setSelectionRange. Undefined
  // outside word processor mode (clicks fall through to onActivate only).
  onCharClick?: (index: number) => void;
  // True for a brief window after any keystroke or caret-moving action
  // (see ReadPage) - suspends the blink animation and forces the caret
  // solid, matching how native text carets stay visible while you're
  // actively typing rather than blinking mid-motion.
  caretMoving?: boolean;
}

const VerseRowImpl = forwardRef<HTMLDivElement, VerseRowProps>(function VerseRowImpl(
  {
    index,
    text,
    status,
    typed = "",
    isComposing = false,
    language,
    isBookmarked = false,
    onActivate,
    cursorPos = null,
    onCharClick,
    caretMoving = false,
  },
  ref
) {
  // Word processor mode changes the *active* verse's tap gesture: a single
  // click there now means "place the caret" (onCharClick, wired per-
  // character below), so bookmarking needs the more deliberate double-
  // click/double-tap instead of clobbering caret placement. Every other
  // row (pending/done, or the active row when word processor mode is
  // off) keeps the original single-click/long-press gesture exactly as
  // before - onCharClick being defined is what signals "this row has a
  // competing single-tap meaning," not the mode flag directly, so this
  // stays correct even if word processor mode has other future uses.
  const usesDoubleTapGesture = !!onCharClick;
  const longPress = useLongPress(onActivate ?? (() => {}), !!onActivate && !usesDoubleTapGesture);
  const doubleTap = useDoubleTap(onActivate ?? (() => {}), !!onActivate && usesDoubleTapGesture);
  const tapHandlers = onActivate ? (usesDoubleTapGesture ? doubleTap : longPress) : undefined;
  const rowClassName = onActivate ? "verseTappable" : undefined;
  const bibTextClassName = `bibText${isBookmarked ? " bookmarkedVerse" : ""}`;

  // Pending and completed verses are plain text. No letter-splitting, no
  // per-character inline styles, no per-keystroke re-render cost.
  if (status !== "active") {
    return (
      <div
        ref={ref}
        className={rowClassName}
        style={{ display: "flex", gap: "8px", opacity: status === "pending" ? 0.3 : 1 }}
        {...tapHandlers}
      >
        <span className="verseNum" style={{ color: "var(--color-text)"}}>
          {index + 1}
        </span>
        <span className={bibTextClassName}>{text}</span>
      </div>
    );
  }

  // Only the verse currently being typed needs the per-letter breakdown.
  const letters = text.split("");
  const composingIndex = isComposing ? typed.length - 1 : -1;
  // Outside word processor mode (cursorPos null), the caret has always
  // just been "wherever typing would land next" - end of what's typed so
  // far. In word processor mode it's the hidden input's real
  // selectionStart, which can sit anywhere from a click or arrow key.
  const effectiveCursor = cursorPos ?? typed.length;

  return (
    <div ref={ref} className={rowClassName} style={{ display: "flex", gap: "8px" }} {...tapHandlers}>
      <span className="verseNum" style={{ color: "var(--color-text)", marginRight: "20px"}}>
        {index + 1}
      </span>
      <div className={isBookmarked ? "bookmarkedVerse" : undefined}>
        {letters.map((char, i) => {
          const isComposingHere = i === composingIndex;
          let displayChar = char;
          let color = "var(--color-untyped)";
          let isMistake = false;

          if (isComposingHere) {
            displayChar = typed[i];
            color = "var(--color-composing)";
          } else if (i < typed.length && typed[i] !== UNTYPED_MARKER) {
            // charMatches handles curly-quote equivalence and the
            // untypeable-character wildcard (for non-Korean text).
            isMistake = !charMatches(typed[i], char, language);
            color = isMistake ? "var(--color-incorrect)" : "var(--color-correct)";
            // On a mistake, show what they actually typed rather than the
            // target letter - matches the convention typing trainers like
            // MonkeyType/Keybr use, and lets someone see *which* key they
            // fat-fingered instead of just "this spot is wrong."
            if (isMistake) displayChar = typed[i];
          }

          // Previously unconditionally suppressed by `!isComposing` - that's
          // the bug where the caret vanished entirely while typing Korean,
          // since a syllable is "mid-composition" for the whole time it's
          // being built. The caret only needs to skip the exact slot a
          // syllable is currently composing in (composingIndex, which
          // renders its own live preview via isComposingHere below) - every
          // other position, composing or not, should still show it.
          const showCursor = i === effectiveCursor && i !== composingIndex;
          // A mistyped space has no visible glyph of its own, so a border or
          // background on it isn't reliable by default: when that space
          // happens to be the one a soft line-wrap breaks on, normal CSS
          // whitespace handling collapses it to zero width at the end of
          // the line, taking any styling on it down to invisible too -
          // exactly the "invisible error" case. `whiteSpace: "pre"` on just
          // this one character opts it out of that collapsing so its box
          // keeps real width no matter where it lands, and padding turns it
          // into a small colored chip that reads clearly as a mistake even
          // sitting right at the edge of a line.
          //
          // Keyed off `displayChar` (what's rendered) rather than `char`
          // (the target) so it catches both directions: a missed space
          // (target was " ", they typed a letter - char === " ") and the
          // mirror case (target was a letter, they typed a space -
          // displayChar === " ", now that displayChar shows their actual
          // keystroke on a mistake). Either way the glyph in this cell is a
          // space, so either way it needs the chip to stay visible.
          const isMistakenSpace = isMistake && displayChar === " ";

          return (
            <span
              key={i}
              data-char-index={i}
              className="charCell"
              style={{ position: "relative", ...(onCharClick && { cursor: "text" }) }}
              onClick={onCharClick ? () => onCharClick(i) : undefined}
            >
              {showCursor && (
                <span
                  className={`typingCaret${caretMoving ? " caretMoving" : ""}`}
                  style={{
                    position: "absolute",
                    left: -1,
                    bottom: 0,
                    width: "2px",
                    // em, not a fixed rem, so the caret's height always
                    // matches *this* span's own font-size - inherited from
                    // the shared .charCell wrapper (see index.css), which
                    // tracks the user's Text Size setting via its clamp().
                    // A flat "2rem" instead drifts out of sync with the
                    // glyph next to it any time the active font-size and
                    // the root rem scale diverge (e.g. mobile's narrower
                    // clamp() output vs desktop's), which is what made it
                    // look oversized on phones.
                    height: "1.1em",
                    background: "var(--color-cursor)",
                  }}
                />
              )}
              <span
                className="bibTextActive"
                style={{
                  color,
                  ...(isMistakenSpace && {
                    whiteSpace: "pre",
                    backgroundColor: "var(--color-incorrect)",
                    borderRadius: "2px",
                    padding: "0 2px",
                  }),
                }}
              >
                {displayChar}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
});

// memo() means: unless this specific row's own props changed, skip it entirely.
export const VerseRow = memo(VerseRowImpl);
