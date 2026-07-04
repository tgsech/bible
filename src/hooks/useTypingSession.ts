import { useCallback, useState } from "react";

export interface TypingSession {
  verseIndex: number;
  typed: string;
  completedTyped: string[];
  startTime: number | null;
  endTime: number | null;
  // Running counters used for live WPM/accuracy. "Keystroke" here means one
  // finalized character: for English that's every character as it's typed;
  // for Korean (or any IME-composed script) it's one per completed syllable,
  // scored at composition-end rather than mid-composition - see commitComposition.
  correctKeystrokes: number;
  totalKeystrokes: number;
}

const initialSession: TypingSession = {
  verseIndex: 0,
  typed: "",
  completedTyped: [],
  startTime: null,
  endTime: null,
  correctKeystrokes: 0,
  totalKeystrokes: 0,
};

export function useTypingSession(verses: string[]) {
  const [session, setSession] = useState<TypingSession>(initialSession);

  const reset = useCallback(() => {
    setSession(initialSession);
  }, []);

  // Called on every onChange. `isComposing` must be skipped for scoring -
  // otherwise a syllable gets graded while it's still half-typed.
  const handleInput = useCallback(
    (value: string, isComposing: boolean) => {
      setSession((prev) => {
        const currentVerse = verses[prev.verseIndex];
        if (currentVerse === undefined || value.length > currentVerse.length) return prev;

        const startTime = prev.startTime ?? (value.length > 0 ? Date.now() : null);

        let { correctKeystrokes, totalKeystrokes } = prev;
        // Only score plain appended characters that aren't mid-composition.
        // IME composition growth is scored separately in commitComposition,
        // once the syllable is actually finished.
        if (!isComposing && value.length > prev.typed.length && value.startsWith(prev.typed)) {
          for (let i = prev.typed.length; i < value.length; i++) {
            totalKeystrokes++;
            if (value[i] === currentVerse[i]) correctKeystrokes++;
          }
        }

        if (value.length === currentVerse.length && value === currentVerse) {
          const isLastVerse = prev.verseIndex === verses.length - 1;
          return {
            verseIndex: isLastVerse ? prev.verseIndex : prev.verseIndex + 1,
            typed: isLastVerse ? value : "",
            completedTyped: [...prev.completedTyped, value],
            startTime,
            endTime: isLastVerse ? Date.now() : prev.endTime,
            correctKeystrokes,
            totalKeystrokes,
          };
        }

        return { ...prev, typed: value, startTime, correctKeystrokes, totalKeystrokes };
      });
    },
    [verses]
  );

  // Called on compositionEnd with (value right before this syllable started,
  // value right after it finished). Scores the newly-finalized character(s)
  // exactly once, against what they should be - not against an in-progress guess.
  const commitComposition = useCallback(
    (baseline: string, value: string) => {
      setSession((prev) => {
        const currentVerse = verses[prev.verseIndex];
        if (!currentVerse) return prev;

        let { correctKeystrokes, totalKeystrokes } = prev;
        if (value.length > baseline.length && value.startsWith(baseline)) {
          for (let i = baseline.length; i < value.length; i++) {
            totalKeystrokes++;
            if (value[i] === currentVerse[i]) correctKeystrokes++;
          }
        }
        return { ...prev, correctKeystrokes, totalKeystrokes };
      });
    },
    [verses]
  );

  return { session, handleInput, commitComposition, reset };
}
