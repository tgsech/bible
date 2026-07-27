import { memo, forwardRef } from "react";
import { charMatches } from "../typing/charMatch";
import { useLongPress } from "../hooks/useLongPress";

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
}

const VerseRowImpl = forwardRef<HTMLDivElement, VerseRowProps>(function VerseRowImpl(
  { index, text, status, typed = "", isComposing = false, language, isBookmarked = false, onActivate },
  ref
) {
  const longPress = useLongPress(onActivate ?? (() => {}), !!onActivate);
  const tapHandlers = onActivate ? longPress : undefined;
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
          } else if (i < typed.length) {
            // charMatches handles curly-quote equivalence and the
            // untypeable-character wildcard (for non-Korean text).
            isMistake = !charMatches(typed[i], char, language);
            color = isMistake ? "var(--color-incorrect)" : "var(--color-correct)";
          }

          const showCursor = i === typed.length && !isComposing;
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
          const isMistakenSpace = isMistake && char === " ";

          return (
            <span key={i} style={{ position: "relative" }}>
              {showCursor && (
                <span
                  style={{
                    position: "absolute",
                    left: -1,
                    bottom: 0.5,
                    width: "2px",
                    height: "2rem",
                    background: "var(--color-cursor)",
                    animation: "blink 1s step-end infinite",
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
