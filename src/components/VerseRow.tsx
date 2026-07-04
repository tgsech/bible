import { memo } from "react";

export type VerseStatus = "pending" | "active" | "done";

interface VerseRowProps {
  index: number;
  text: string;
  status: VerseStatus;
  typed?: string; // only meaningful when status === "active"
  isComposing?: boolean; // only meaningful when status === "active"
}

function VerseRowImpl({ index, text, status, typed = "", isComposing = false }: VerseRowProps) {
  // Pending and completed verses are plain text. No letter-splitting, no
  // per-character inline styles, no per-keystroke re-render cost - this is
  // the fix for chapters getting laggy as they get long.
  if (status !== "active") {
    return (
      <div style={{ display: "flex", gap: "8px", opacity: status === "pending" ? 0.3 : 1 }}>
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
    <div style={{ display: "flex", gap: "8px" }}>
      <span className="verseNum" style={{ color: "gray", minWidth: "20px" }}>
        {index + 1}
      </span>
      <div>
        {letters.map((char, i) => {
          const isComposingHere = i === composingIndex;
          let displayChar = char;
          let color = "#6f8cdc";

          if (isComposingHere) {
            displayChar = typed[i];
            color = "#001a47";
          } else if (i < typed.length) {
            color = typed[i] === char ? "black" : "#d7c7ba";
          }

          const showCursor = i === typed.length && !isComposing;

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
                    background: "black",
                    animation: "blink 1s step-end infinite",
                  }}
                />
              )}
              <span className="bibText" style={{ color }}>
                {displayChar}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// memo() means: unless this specific row's own props changed, skip it entirely.
// Typing in verse 40 no longer touches verses 1-39 or 41+ on every keystroke.
export const VerseRow = memo(VerseRowImpl);
