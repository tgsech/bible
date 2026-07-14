import { memo, forwardRef } from "react";
import { charMatches } from "../typing/charMatch";

export type VerseStatus = "pending" | "active" | "done";

interface VerseRowProps {
  index: number;
  text: string;
  status: VerseStatus;
  typed?: string; // only meaningful when status === "active"
  isComposing?: boolean; // only meaningful when status === "active"
  language: string;
}

const VerseRowImpl = forwardRef<HTMLDivElement, VerseRowProps>(function VerseRowImpl(
  { index, text, status, typed = "", isComposing = false, language },
  ref
) {
  // Pending and completed verses are plain text. No letter-splitting, no
  // per-character inline styles, no per-keystroke re-render cost.
  if (status !== "active") {
    return (
      <div ref={ref} style={{ display: "flex", gap: "8px", opacity: status === "pending" ? 0.3 : 1 }}>
        <span className="verseNum" style={{ color: "gray", minWidth: "20px" }}>
          {index + 1}
        </span>
        <span className="bibText">{text}</span>
      </div>
    );
  }

  // Only the verse currently being typed needs the per-letter breakdown.
  const letters = text.split("");
  const composingIndex = isComposing ? typed.length - 1 : -1;

  return (
    <div ref={ref} style={{ display: "flex", gap: "8px" }}>
      <span className="verseNum" style={{ color: "gray", minWidth: "20px" }}>
        {index + 1}
      </span>
      <div>
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
          // A mistyped space has no visible glyph, so coloring its text does
          // nothing - give it a small underline instead so mistakes there
          // are still noticeable without being flashy.
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
                className="bibText"
                style={{
                  color,
                  ...(isMistakenSpace && {
                    borderBottom: "2px solid var(--color-incorrect)",
                    paddingBottom: "1px",
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
