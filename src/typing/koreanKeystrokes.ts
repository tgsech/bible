// Approximates how many physical keystrokes a Hangul syllable takes on a
// standard 2-beolsik keyboard layout. Korean typing speed is conventionally
// reported as raw keystrokes/minute (타수/분), not English's "5 characters =
// 1 word" convention, and a syllable's keystroke cost varies: 가 is 2 keys,
// 한 is 3, 닭 is 4 (compound batchim), 왜 is 3 (compound vowel).

const COMPLEX_MEDIALS = new Set(["ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"]);
const COMPLEX_FINALS = new Set([
  "ㄳ", "ㄵ", "ㄶ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅄ",
]);

const MEDIALS = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ",
  "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];
const FINALS = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ",
  "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ",
  "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

/**
 * Number of keystrokes a single character costs. Precomposed Hangul
 * syllables are decomposed into initial/medial/final jamo; compound vowels
 * and batchim (e.g. ㅘ, ㄳ) cost two key presses since there's no dedicated
 * key for them, matching standard 2-beolsik layout. The initial consonant
 * always counts as one keypress, including shifted tense consonants
 * (ㄲ/ㄸ/ㅃ/ㅆ/ㅉ), per the usual 타수 counting convention.
 * Everything else (spaces, punctuation, stray Latin letters) is 1 keystroke.
 */
export function keystrokesForChar(char: string): number {
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return 1;

  const sIndex = code - HANGUL_BASE;
  const medialIndex = Math.floor((sIndex % (21 * 28)) / 28);
  const finalIndex = sIndex % 28;

  let keystrokes = 1; // initial consonant
  keystrokes += COMPLEX_MEDIALS.has(MEDIALS[medialIndex]) ? 2 : 1;

  const finalJamo = FINALS[finalIndex];
  if (finalJamo) keystrokes += COMPLEX_FINALS.has(finalJamo) ? 2 : 1;

  return keystrokes;
}
