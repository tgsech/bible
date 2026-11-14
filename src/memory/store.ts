// Memory-tool progress. Lives in localStorage only (no backend yet), one
// record per passage language since memorizing the Korean text and the
// English text are separate jobs.
//
// Per verse we keep a 0-100 "mastery" number. Practice with a visible aid
// can only raise it, and only up to that mode's cap (typing a verse you
// can see proves less than typing it from nothing). The unaided test sets
// it directly and is the only thing that can lower it.

import { useSyncExternalStore } from "react";
import { CONTEST_DATE, PASSAGE, VERSE_NUMBERS, type PassageLang } from "./passage";
import { useLanguage } from "../i18n/LanguageContext";

const KEY = "livingwords:memory:v1";

export const PASS_SCORE = 90;
/** Days until a card comes back, by Leitner box. */
export const BOX_DAYS = [0, 1, 2, 4, 7];
const DAY_MS = 86_400_000;

export interface VerseState {
  /** mastery, 0-100 */
  m: number;
  box: number;
  /** epoch ms the flashcard is next due */
  due: number;
}

export interface TestRecord {
  t: number;
  score: number;
  kind: string;
}

export interface LangState {
  verses: Record<number, VerseState>;
  practiceMs: number;
  /** distinct YYYY-MM-DD days with any practice */
  days: string[];
  tests: TestRecord[];
  passedFull: boolean;
}

interface MemState {
  passageLang: PassageLang | null;
  ko: LangState;
  en: LangState;
}

function emptyLang(): LangState {
  return { verses: {}, practiceMs: 0, days: [], tests: [], passedFull: false };
}

function load(): MemState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MemState>;
      return {
        passageLang: parsed.passageLang === "ko" || parsed.passageLang === "en" ? parsed.passageLang : null,
        ko: { ...emptyLang(), ...parsed.ko },
        en: { ...emptyLang(), ...parsed.en },
      };
    }
  } catch {
    /* unreadable or blocked storage - start fresh */
  }
  return { passageLang: null, ko: emptyLang(), en: emptyLang() };
}

let state = load();
const listeners = new Set<() => void>();

function commit(next: MemState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* progress just won't survive a reload */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function verseState(ls: LangState, verse: number): VerseState {
  return ls.verses[verse] ?? { m: 0, box: 0, due: 0 };
}

export function overallMastery(ls: LangState): number {
  const sum = VERSE_NUMBERS.reduce((acc, v) => acc + verseState(ls, v).m, 0);
  return sum / VERSE_NUMBERS.length;
}

function withTime(ls: LangState, ms: number): LangState {
  const day = new Date().toLocaleDateString("sv");
  return {
    ...ls,
    practiceMs: ls.practiceMs + Math.max(0, ms),
    days: ls.days.includes(day) ? ls.days : [...ls.days, day],
  };
}

function update(lang: PassageLang, fn: (ls: LangState) => LangState) {
  commit({ ...state, [lang]: fn(state[lang]) });
}

export function setPassageLang(lang: PassageLang) {
  commit({ ...state, passageLang: lang });
}

export interface PracticeResult {
  verse: number;
  /** 0-100 */
  accuracy: number;
  /** the most mastery this kind of practice can prove */
  cap: number;
}

/** Aided practice: nudges mastery up toward accuracy x cap, never down. */
export function recordPractice(lang: PassageLang, results: PracticeResult[], ms: number) {
  update(lang, (ls) => {
    const verses = { ...ls.verses };
    for (const r of results) {
      const old = verseState(ls, r.verse);
      const target = (r.accuracy * r.cap) / 100;
      if (target > old.m) verses[r.verse] = { ...old, m: old.m + (target - old.m) * 0.6 };
    }
    return withTime({ ...ls, verses }, ms);
  });
}

/** Unaided test: a better score replaces mastery, a worse one pulls it
 *  halfway down (one bad run shouldn't erase everything). */
export function recordTest(
  lang: PassageLang,
  results: { verse: number; score: number }[],
  ms: number,
  kind: string,
): number {
  const overall = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
  update(lang, (ls) => {
    const verses = { ...ls.verses };
    for (const r of results) {
      const old = verseState(ls, r.verse);
      verses[r.verse] = { ...old, m: r.score >= old.m ? r.score : old.m + (r.score - old.m) * 0.5 };
    }
    return withTime(
      {
        ...ls,
        verses,
        tests: [...ls.tests, { t: Date.now(), score: overall, kind }].slice(-50),
        passedFull: ls.passedFull || (kind !== "quick" && overall >= PASS_SCORE),
      },
      ms,
    );
  });
  return overall;
}

export type CardRating = "again" | "hard" | "good";

/** Spaced-repetition self-rating for one verse card. */
export function rateCard(lang: PassageLang, verse: number, rating: CardRating, ms: number) {
  update(lang, (ls) => {
    const old = verseState(ls, verse);
    const now = Date.now();
    let next: VerseState;
    if (rating === "again") {
      next = { ...old, box: 0, due: now };
    } else {
      const box = rating === "good" ? Math.min(BOX_DAYS.length - 1, old.box + 1) : Math.max(1, old.box);
      const days = rating === "good" ? BOX_DAYS[box] : 1;
      const target = rating === "good" ? 80 : 50;
      next = { m: target > old.m ? old.m + (target - old.m) * 0.6 : old.m, box, due: now + days * DAY_MS };
    }
    return withTime({ ...ls, verses: { ...ls.verses, [verse]: next } }, ms);
  });
}

export function resetProgress(lang: PassageLang) {
  update(lang, () => emptyLang());
}

export function daysUntilContest(now: number): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((CONTEST_DATE.getTime() - today.getTime()) / DAY_MS);
}

export type Estimate =
  | { kind: "none" }
  | { kind: "done" }
  | { kind: "eta"; remainingMin: number; perDayMin: number | null };

/** Straight-line projection: you've earned `mastery` points in
 *  `practiceMs` of practice, so the remaining points should cost about
 *  the same per point. */
export function estimate(ls: LangState, now: number): Estimate {
  const m = overallMastery(ls);
  if (m >= 99.5) return { kind: "done" };
  if (m < 1 || ls.practiceMs < 30_000) return { kind: "none" };
  const remainingMin = Math.max(1, Math.round((ls.practiceMs * (100 - m)) / m / 60_000));
  const daysLeft = daysUntilContest(now);
  return { kind: "eta", remainingMin, perDayMin: daysLeft > 0 ? Math.ceil(remainingMin / daysLeft) : null };
}

/** Passage language follows the site language until the user picks one. */
export function useMemory() {
  const s = useSyncExternalStore(subscribe, () => state);
  const { lang: siteLang } = useLanguage();
  const lang: PassageLang = s.passageLang ?? siteLang;
  return { lang, ls: s[lang], passage: PASSAGE[lang] };
}
