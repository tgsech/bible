import { useCallback, useState } from "react";

export interface TypingSession {
  verseIndex: number;
  typed: string;
  completedTyped: string[];
  startTime: number | null;
  endTime: number | null;
}

const initialSession: TypingSession = {
  verseIndex: 0,
  typed: "",
  completedTyped: [],
  startTime: null,
  endTime: null,
};

export function useTypingSession(verses: string[]) {
  const [session, setSession] = useState<TypingSession>(initialSession);

  const reset = useCallback(() => {
    setSession(initialSession);
  }, []);

  const handleInput = useCallback(
    (value: string) => {
      setSession((prev) => {
        const currentVerse = verses[prev.verseIndex];
        if (currentVerse === undefined || value.length > currentVerse.length) return prev;

        const startTime = prev.startTime ?? (value.length > 0 ? Date.now() : null);

        if (value.length === currentVerse.length && value === currentVerse) {
          const isLastVerse = prev.verseIndex === verses.length - 1;
          return {
            verseIndex: isLastVerse ? prev.verseIndex : prev.verseIndex + 1,
            typed: isLastVerse ? value : "",
            completedTyped: [...prev.completedTyped, value],
            startTime,
            endTime: isLastVerse ? Date.now() : prev.endTime,
          };
        }

        return { ...prev, typed: value, startTime };
      });
    },
    [verses]
  );

  return { session, handleInput, reset };
}
