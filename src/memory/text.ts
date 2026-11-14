// Word-level helpers shared by every memory mode: splitting a verse into
// words, comparing what was typed against it (punctuation, case and
// spacing never count against you), and building the partial hints.

import type { PassageLang } from "./passage";

/** Display words. An em dash glues two words together in the NIV text
 *  ("it—not"), so it's treated as a word break. */
export function tokenize(text: string): string[] {
  return text
    .replace(/—/g, "— ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/** Comparison form of a word: letters and digits only, lowercased. */
export function norm(word: string): string {
  return word.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export interface Grade {
  /** 0-100 */
  score: number;
  /** The verse's display words. */
  tokens: string[];
  /** Per display word: did the attempt contain it, in order? */
  marks: boolean[];
}

/** Grades a typed attempt letter by letter (longest common subsequence)
 *  with all spacing and punctuation removed, so a spacing slip costs
 *  nothing and a wrong or skipped word costs only its own letters. Extra
 *  letters count against the score too. A word is marked as known only
 *  if every one of its letters was matched. */
export function gradeAttempt(target: string, typed: string): Grade {
  const tokens = tokenize(target);
  const a: string[] = [];
  const wordOf: number[] = [];
  tokens.forEach((w, wi) => {
    for (const ch of norm(w)) {
      a.push(ch);
      wordOf.push(wi);
    }
  });
  const b = Array.from(norm(typed));
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const marks = new Array<boolean>(tokens.length).fill(true);
  let i = 0;
  let j = 0;
  while (i < n) {
    if (j < m && a[i] === b[j]) {
      i++;
      j++;
    } else if (j >= m || dp[i + 1][j] >= dp[i][j + 1]) {
      marks[wordOf[i]] = false;
      i++;
    } else {
      j++;
    }
  }
  const denom = Math.max(n, m, 1);
  return { score: Math.floor((dp[0][0] / denom) * 100), tokens, marks };
}

/** First letter kept, the rest of the letters replaced ("각○", "E____"). */
export function hintWord(word: string, lang: PassageLang): string {
  const blank = lang === "ko" ? "○" : "_";
  let seen = false;
  return Array.from(word)
    .map((ch) => {
      if (!/[\p{L}\p{N}]/u.test(ch)) return ch;
      if (!seen) {
        seen = true;
        return ch;
      }
      return blank;
    })
    .join("");
}

/** Every letter hidden; only the length survives. */
export function maskWord(word: string): string {
  return Array.from(word)
    .map((ch) => (/[\p{L}\p{N}]/u.test(ch) ? "●" : ch))
    .join("");
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A stable pseudo-random ordering of 0..n-1, so the same verse always
 *  loses its words in the same order between rounds. */
export function seededOrder(n: number, seed: number): number[] {
  let s = (seed * 2654435761) >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const out = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type T = (key: string, vars?: Record<string, string | number>) => string;

export function fmtMinutes(min: number, t: T): string {
  if (min < 60) return t("memory.time.min", { m: min });
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? t("memory.time.hour", { h }) : t("memory.time.hourMin", { h, m });
}

/** Wall-clock read for event handlers (kept out of component bodies). */
export function nowMs(): number {
  return Date.now();
}
