import { useCallback, useState } from "react";
import { charMatches, matchesFully } from "../typing/charMatch";
import { keystrokesForChar } from "../typing/koreanKeystrokes";

// After this many idle ms between two keystrokes, the gap stops counting as
// active typing time - same idea as most typing-test sites: a coffee-break
// mid-chapter shouldn't tank your wpm/cpm. Shared by LiveStats (which uses
// it to freeze the live counter mid-pause) and this hook (which uses it to
// build the cumulative `pausedMs` that both the live counter and the
// final/saved completion stats subtract), so the two can never drift apart.
export const PAUSE_THRESHOLD_MS = 5000;

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
  // Wall-clock time of the most recent accepted keystroke (including
  // mid-composition Korean input, not just finalized syllables). Purely
  // local UI state - never sent to the backend or factored into saved
  // progress - used by LiveStats to freeze the display during an ongoing
  // pause, and by this hook itself to measure the gap since the previous
  // keystroke each time a new one lands.
  lastActivityAt: number | null;
  // Cumulative idle time, beyond PAUSE_THRESHOLD_MS, between consecutive
  // keystrokes so far this session. Updated once per accepted keystroke
  // (see handleInput/commitComposition below), so by the time a chapter
  // finishes this already reflects every pause that happened along the
  // way - ReadPage subtracts it from (endTime - startTime) for the
  // completion card and the stats logged to the backend, and LiveStats
  // subtracts it (plus whatever pause is still ongoing) for the live
  // counter. Same number, same formula, both places - so the two can't
  // show different speeds for the same chapter.
  pausedMs: number;
  // Active-typing time (same pause-excluded definition as `pausedMs`
  // subtracts for) accumulated across every *previous* sitting on this
  // chapter, as of the last save - see progress.ts's elapsedMs column.
  // Zero for a genuinely fresh chapter. On resume this is the seed that
  // keeps the live/final wpm counting up from where a prior sitting left
  // off instead of restarting at zero; this sitting's own wall-clock time
  // (startTime/endTime/pausedMs, computed same as always) is added on top
  // of it wherever elapsed time is displayed or logged - see LiveStats and
  // ReadPage's finalStats/completion-POST/save-progress call sites, all of
  // which use this same "baseElapsedMs + this sitting's elapsed" formula
  // so none of them can drift from each other.
  baseElapsedMs: number;
  // correctKeystrokes/totalKeystrokes accumulated across every *previous*
  // sitting on this chapter, as of the last save - same idea and same
  // source (progress.ts) as baseElapsedMs above, just for accuracy instead
  // of speed. Added to this sitting's own correctKeystrokes/totalKeystrokes
  // at every display/log site so a resumed chapter's accuracy reflects the
  // whole chapter typed so far, not just the keystrokes since resuming.
  baseCorrectKeystrokes: number;
  baseTotalKeystrokes: number;
}

const initialSession: TypingSession = {
  verseIndex: 0,
  typed: "",
  completedTyped: [],
  startTime: null,
  endTime: null,
  correctKeystrokes: 0,
  totalKeystrokes: 0,
  lastActivityAt: null,
  pausedMs: 0,
  baseElapsedMs: 0,
  baseCorrectKeystrokes: 0,
  baseTotalKeystrokes: 0,
};

interface ResumeState {
  verseIndex: number;
  typed: string;
  // Whatever was last saved for this chapter's live-stat baseline (see
  // progress.ts) - all optional/defaulted to 0 so a resume payload that
  // predates these fields (or a guest's pre-existing localStorage entry)
  // still resumes cleanly, just starting the live counter at zero same as
  // before this existed.
  elapsedMs?: number;
  correctKeystrokes?: number;
  totalKeystrokes?: number;
}

// Given the previous keystroke's timestamp (or null if there wasn't one
// yet) and "now", returns how much of the gap between them should be added
// to pausedMs - zero if there was no previous keystroke, or if the gap
// didn't exceed the grace period.
function pauseSince(prevActivityAt: number | null, now: number): number {
  if (prevActivityAt === null) return 0;
  const gap = now - prevActivityAt;
  return gap > PAUSE_THRESHOLD_MS ? gap - PAUSE_THRESHOLD_MS : 0;
}

export function useTypingSession(verses: string[], language: string, manualAdvance: boolean = false) {
  const [session, setSession] = useState<TypingSession>(initialSession);

  // Called with no args for a genuinely fresh chapter. Called with a
  // ResumeState to restore a previously-saved position: `completedTyped`
  // only needs the right *length* (nothing downstream reads its contents,
  // only .length — see ChapterView), so it's backfilled with placeholders
  // rather than the verses' real original typed text, which was never
  // saved. Keystroke counters intentionally stay at zero on resume: we
  // don't have the original per-keystroke history, so this sitting's
  // wpm/accuracy only reflects typing from the resume point forward (and
  // pausedMs resets to 0 for the same reason - via ...initialSession).
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
      // Seed this sitting's live-stat baseline from what was last saved,
      // so LiveStats/finalStats can keep counting up from a prior sitting
      // instead of restarting at zero. Not applied to correctKeystrokes/
      // totalKeystrokes directly (those stay 0, per the comment above) -
      // instead carried separately as the "base" that gets added on top
      // wherever elapsed time/wpm is displayed or logged, alongside this
      // sitting's own counters. Skipped entirely for the already-complete
      // case: that resume is purely cosmetic (see alreadyComplete above),
      // not a real sitting to build on.
      baseElapsedMs: alreadyComplete ? 0 : resume.elapsedMs ?? 0,
      baseCorrectKeystrokes: alreadyComplete ? 0 : resume.correctKeystrokes ?? 0,
      baseTotalKeystrokes: alreadyComplete ? 0 : resume.totalKeystrokes ?? 0,
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

        const now = Date.now();
        const startTime = prev.startTime ?? (value.length > 0 ? now : null);
        const pausedMs = prev.pausedMs + pauseSince(prev.lastActivityAt, now);

        let { correctKeystrokes, totalKeystrokes } = prev;
        // Only score plain appended characters that aren't mid-composition.
        // IME composition growth is scored separately in commitComposition,
        // once the syllable is actually finished.
        //
        // Word processor mode lets someone click/arrow back into the
        // middle of what they've already typed and retype over a mistake
        // there (see ReadPage's onChange overwrite transform - it keeps
        // `value` the same length as `prev.typed` for that kind of edit
        // rather than letting the browser insert-and-shift). That's the
        // same-length branch below: diff the two strings position by
        // position and score whichever index actually changed, against
        // that index's real target character - not against the tail of
        // the string, which is what the old append-only assumption did
        // (and why it silently stopped scoring anything once someone
        // edited mid-verse). Every overwrite keystroke counts once, the
        // same way every appended keystroke always has - nothing is ever
        // retroactively un-scored for a position that was already typed
        // and correct before.
        if (!isComposing && value.length === prev.typed.length) {
          for (let i = 0; i < value.length; i++) {
            if (value[i] === prev.typed[i]) continue;
            const weight = weightOf(currentVerse[i]);
            totalKeystrokes += weight;
            if (charMatches(value[i], currentVerse[i], language)) correctKeystrokes += weight;
          }
        } else if (!isComposing && value.length > prev.typed.length && value.startsWith(prev.typed)) {
          for (let i = prev.typed.length; i < value.length; i++) {
            const weight = weightOf(currentVerse[i]);
            totalKeystrokes += weight;
            if (charMatches(value[i], currentVerse[i], language)) correctKeystrokes += weight;
          }
        }

        const isVerseComplete = value.length === currentVerse.length && matchesFully(value, currentVerse, language);

        // With manualAdvance on, a fully-correct verse stays put instead of
        // auto-clearing - typed holds the completed string (rather than
        // resetting to "") so VerseRow keeps showing it as finished, and
        // the person explicitly advances via Space/Enter (see `advance`
        // below), which is the only other place completedTyped/verseIndex
        // move forward in that mode.
        if (isVerseComplete && manualAdvance) {
          return {
            ...prev,
            typed: value,
            startTime,
            correctKeystrokes,
            totalKeystrokes,
            lastActivityAt: now,
            pausedMs,
          };
        }

        if (isVerseComplete) {
          const isLastVerse = prev.verseIndex === verses.length - 1;
          return {
            ...prev,
            verseIndex: isLastVerse ? prev.verseIndex : prev.verseIndex + 1,
            typed: isLastVerse ? value : "",
            completedTyped: [...prev.completedTyped, value],
            startTime,
            endTime: isLastVerse ? now : prev.endTime,
            correctKeystrokes,
            totalKeystrokes,
            lastActivityAt: now,
            pausedMs,
          };
        }

        return {
          ...prev,
          typed: value,
          startTime,
          correctKeystrokes,
          totalKeystrokes,
          lastActivityAt: now,
          pausedMs,
        };
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

        const now = Date.now();
        const pausedMs = prev.pausedMs + pauseSince(prev.lastActivityAt, now);

        let { correctKeystrokes, totalKeystrokes } = prev;
        if (value.length > baseline.length && value.startsWith(baseline)) {
          for (let i = baseline.length; i < value.length; i++) {
            const weight = weightOf(currentVerse[i]);
            totalKeystrokes += weight;
            if (charMatches(value[i], currentVerse[i], language)) correctKeystrokes += weight;
          }
        }
        return { ...prev, correctKeystrokes, totalKeystrokes, lastActivityAt: now, pausedMs };
      });
    },
    [verses, language, weightOf]
  );

  // manualAdvance's explicit Space/Enter path: only moves forward if the
  // current verse is sitting there fully correct already (handleInput
  // above is what gets it into that state in the first place - this just
  // performs the transition handleInput would have done automatically).
  // A no-op otherwise, so a stray Space/Enter on an incomplete or
  // mistyped verse does nothing rather than skipping ahead.
  const advance = useCallback(() => {
    setSession((prev) => {
      const currentVerse = verses[prev.verseIndex];
      if (!currentVerse) return prev;
      if (!matchesFully(prev.typed, currentVerse, language)) return prev;

      const now = Date.now();
      const isLastVerse = prev.verseIndex === verses.length - 1;
      return {
        ...prev,
        verseIndex: isLastVerse ? prev.verseIndex : prev.verseIndex + 1,
        typed: isLastVerse ? prev.typed : "",
        completedTyped: [...prev.completedTyped, prev.typed],
        endTime: isLastVerse ? now : prev.endTime,
      };
    });
  }, [verses, language]);

  return { session, handleInput, commitComposition, reset, advance };
}
