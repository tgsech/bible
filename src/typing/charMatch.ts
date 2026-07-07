const SMART_QUOTE_EQUIVALENTS: Record<string, string> = {
  "\u201C": '"', // “
  "\u201D": '"', // ”
  "\u2018": "'", // ‘
  "\u2019": "'", // ’
};

/**
 * Whether a typed character should count as matching the target character
 * at the same position.
 *
 * Exact matches always count. For non-Korean text, characters that are
 * awkward or impossible to type on a standard keyboard get leniency:
 *  - "Smart"/curly quotes accept their plain equivalent (" or '), since most
 *    keyboards can't produce curly quotes directly.
 *  - Anything else outside the basic ASCII range - em dashes, ellipses,
 *    accented Latin letters like é/ñ/ü, etc. - is treated as a wildcard and
 *    accepts whatever was typed. There's often no reasonable way to type
 *    these, especially on a laptop with no numpad/alt-code access.
 *
 * Korean text is deliberately excluded from the wildcard rule: every Hangul
 * syllable is non-ASCII, so applying it there would make all of Korean
 * typing auto-pass.
 */
export function charMatches(typed: string, target: string, language: string): boolean {
  if (typed === target) return true;
  if (language === "ko") return false;

  const straightEquivalent = SMART_QUOTE_EQUIVALENTS[target];
  if (straightEquivalent !== undefined) return typed === straightEquivalent;

  return target.charCodeAt(0) > 127;
}

/** Whether `value` fully matches `target`, character by character, via charMatches. */
export function matchesFully(value: string, target: string, language: string): boolean {
  if (value.length !== target.length) return false;
  for (let i = 0; i < target.length; i++) {
    if (!charMatches(value[i], target[i], language)) return false;
  }
  return true;
}
