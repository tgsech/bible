export interface TypingStats {
  speed: number;
  accuracy: number;
  label: string; // "WPM" or "타/분" depending on language
}

/**
 * Same formula LiveStats uses while typing, factored out so the completion
 * modal (and anything else later - a profile dashboard, session history)
 * computes the exact same numbers rather than a second, possibly-drifting
 * copy of the math.
 */
export function computeTypingStats(
  correctKeystrokes: number,
  totalKeystrokes: number,
  elapsedMs: number,
  language: string
): TypingStats {
  const minutes = elapsedMs / 1000 / 60;
  const isKorean = language === "ko";

  const speed =
    minutes > 0 ? Math.round((isKorean ? correctKeystrokes : correctKeystrokes / 5) / minutes) : 0;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  return { speed, accuracy, label: isKorean ? "타/분" : "WPM" };
}
