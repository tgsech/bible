// Memory-tool progress, one record per passage language since memorizing
// the Korean text and the English text are separate jobs.
//
// localStorage is always the working copy, so guests can use everything.
// When someone is signed in, the same records are also saved to their
// account (/api/memory-progress): on sign-in the account's copy is merged
// with whatever is on this device, and every change after that is pushed.
//
// Per verse we keep a 0-100 "mastery" number. Practice with a visible aid
// can only raise it, and only up to that mode's cap (typing a verse you
// can see proves less than typing it from nothing). The unaided test sets
// it directly and is the only thing that can lower it.

import { useEffect, useSyncExternalStore } from "react";
import { api } from "../lib/api";
import { useSession } from "../lib/authClient";
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
  /** User id of the account this device's copy belongs to; null = guest. */
  owner: string | null;
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
        owner: typeof parsed.owner === "string" ? parsed.owner : null,
        passageLang: parsed.passageLang === "ko" || parsed.passageLang === "en" ? parsed.passageLang : null,
        ko: { ...emptyLang(), ...parsed.ko },
        en: { ...emptyLang(), ...parsed.en },
      };
    }
  } catch {
    /* unreadable or blocked storage - start fresh */
  }
  return { owner: null, passageLang: null, ko: emptyLang(), en: emptyLang() };
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
  schedulePush(lang);
}

/* ---------- account sync ---------- */

const LANGS: PassageLang[] = ["ko", "en"];
const PUSH_DEBOUNCE_MS = 600;

// undefined = not told yet, so the first answer (even "guest") is acted on.
let syncUser: string | null | undefined;
/** True once the account's copy has been merged in; pushes wait for it so
 *  a stale device can't overwrite the account before reading it. */
let pulled = false;
const pushTimers: Partial<Record<PassageLang, number>> = {};

function push(lang: PassageLang) {
  api.put(`/memory-progress/${lang}`, state[lang]).catch((err) => {
    console.error("Failed to save memory progress", err);
  });
}

function schedulePush(lang: PassageLang) {
  if (!syncUser || !pulled) return;
  window.clearTimeout(pushTimers[lang]);
  pushTimers[lang] = window.setTimeout(() => push(lang), PUSH_DEBOUNCE_MS);
}

/** Combines two copies of the same person's progress, keeping the better
 *  of each: higher mastery, the later flashcard schedule, every test. */
function mergeLang(a: LangState, b: LangState | null | undefined): LangState {
  if (!b) return a;
  const other = { ...emptyLang(), ...b };
  const verses: Record<number, VerseState> = {};
  for (const key of new Set([...Object.keys(a.verses), ...Object.keys(other.verses)])) {
    const v = Number(key);
    const x = verseState(a, v);
    const y = verseState(other, v);
    const schedule = y.due > x.due ? y : x;
    verses[v] = { m: Math.max(x.m, y.m), box: schedule.box, due: schedule.due };
  }
  const tests = [...a.tests];
  for (const t of other.tests) if (!tests.some((x) => x.t === t.t)) tests.push(t);
  return {
    verses,
    practiceMs: Math.max(a.practiceMs, other.practiceMs),
    days: [...new Set([...a.days, ...other.days])].sort(),
    tests: tests.sort((x, y) => x.t - y.t).slice(-50),
    passedFull: a.passedFull || other.passedFull,
  };
}

/** Tell the store who is signed in (or null for a guest). */
function setSyncUser(id: string | null) {
  if (id === syncUser) return;
  syncUser = id;
  pulled = false;
  LANGS.forEach((l) => window.clearTimeout(pushTimers[l]));

  if (id === null) {
    // Signed out: an account's progress shouldn't stay behind on a shared
    // device. Guest progress (no owner) is left alone.
    if (state.owner !== null) commit({ ...state, owner: null, ko: emptyLang(), en: emptyLang() });
    return;
  }

  // Progress left here by a different account isn't this user's to inherit.
  if (state.owner !== null && state.owner !== id) {
    commit({ ...state, owner: null, ko: emptyLang(), en: emptyLang() });
  }

  api
    .get<Partial<Record<PassageLang, LangState | null>>>("/memory-progress")
    .then((server) => {
      if (syncUser !== id) return;
      const merged = { ...state, owner: id, ko: mergeLang(state.ko, server?.ko), en: mergeLang(state.en, server?.en) };
      commit(merged);
      pulled = true;
      // Only write back the languages where this device added something.
      for (const l of LANGS) {
        if (JSON.stringify(merged[l]) !== JSON.stringify({ ...emptyLang(), ...server?.[l] })) push(l);
      }
    })
    .catch((err) => console.error("Failed to load memory progress", err));
}

/** Mount once per memory page: keeps the store pointed at the signed-in
 *  account. Does nothing until the session check has actually finished,
 *  so a slow or failed check is never mistaken for "signed out". */
export function useMemoryAccountSync(): { signedIn: boolean } {
  const { data: session, isPending, error } = useSession();
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (isPending || error) return;
    setSyncUser(userId);
  }, [userId, isPending, error]);
  return { signedIn: userId !== null };
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
