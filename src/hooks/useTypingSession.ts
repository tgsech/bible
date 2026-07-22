import { useCallback, useState } from "react";
import { charMatches, matchesFully } from "../typing/charMatch";
import { keystrokesForChar } from "../typing/koreanKeystrokes";

export interface TypingSession {
  verseIndex: number;
  typed: string;
  completedTyped: string[];
  startTime: number | null;
  endTime: number | null;
  // Running counters used for live WPM/accuracy. "Keystroke" here means one
  // finalized character: for English that's every character as it's typed,
  // weighted 1 each; for Korean it's one per completed syllable, weighted by
  // its real jamo/keystroke cost (see koreanKeystrokes.ts) and scored at
  // composition-end rather than mid-composition - see commitComposition.
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

interface ResumeState {
  verseIndex: number;
  typed: string;
}

export function useTypingSession(verses: string[], language: string) {
  const [session, setSession] = useState<TypingSession>(initialSession);

  // Called with no args for a genuinely fresh chapter. Called with a
  // ResumeState to restore a previously-saved position: `completedTyped`
  // only needs the right *length* (nothing downstream reads its contents,
  // only .length — see ChapterView), so it's backfilled with placeholders
  // rather than the verses' real original typed text, which was never
  // saved. Keystroke counters intentionally stay at zero on resume: we
  // don't have the original per-keystroke history, so this sitting's
  // wpm/accuracy only reflects typing from the resume point forward.
  const reset = useCallback((resume?: ResumeState) => {
    if (!resume || resume.verseIndex === 0) {
      setSession(initialSession);
      return;
    }
    const lastIndex = Math.max(verses.length - 1, 0);
    const clampedIndex = Math.min(resume.verseIndex, lastIndex);
    const verseText = verses[clampedIndex] ?? "";
    // If the resume position lands on the last verse with that verse
    // already fully typed, this chapter was finished before — resume it
    // as done rather than leaving the input waiting for a keystroke that
    // can never come (there's nowhere left to type).
    const alreadyComplete = clampedIndex === lastIndex && resume.typed.length >= verseText.length;

    setSession({
      ...initialSession,
      verseIndex: clampedIndex,
      typed: alreadyComplete ? "" : resume.typed,
      completedTyped: Array(alreadyComplete ? verses.length : clampedIndex).fill(""),
      endTime: alreadyComplete ? Date.now() : null,
    });
  }, [verses]);

  const weightOf = useCallback(
    (char: string) => (language === "ko" ? keystrokesForChar(char) : 1),
    [language]
  );

  // Called on every onChange. `isComposing` must be skipped for scoring -
  // otherwise a Korean syllable gets graded while it's still half-typed.
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
            const weight = weightOf(currentVerse[i]);
            totalKeystrokes += weight;
            if (charMatches(value[i], currentVerse[i], language)) correctKeystrokes += weight;
          }
        }

        if (value.length === currentVerse.length && matchesFully(value, currentVerse, language)) {
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
    [verses, language, weightOf]
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
            const weight = weightOf(currentVerse[i]);
            totalKeystrokes += weight;
            if (charMatches(value[i], currentVerse[i], language)) correctKeystrokes += weight;
          }
        }
        return { ...prev, correctKeystrokes, totalKeystrokes };
      });
    },
    [verses, language, weightOf]
  );

  return { session, handleInput, commitComposition, reset };
}
