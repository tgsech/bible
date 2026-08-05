import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useChapter } from "../hooks/useChapter";
import { useTypingSession, PAUSE_THRESHOLD_MS } from "../hooks/useTypingSession";
import { useProgress } from "../hooks/useProgress";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { useReadMode } from "../hooks/useReadMode";
import { useEnvironment } from "../environment/EnvironmentContext";
import { useSavedVerses } from "../hooks/useSavedVerses";
import { computeTypingStats } from "../typing/stats";
import { matchesFully, charMatches, UNTYPED_MARKER } from "../typing/charMatch";
import { useSound } from "../audio/SoundContext";
import { scrollAboveKeyboard, useKeyboardInsetVar } from "../hooks/useKeyboardAwareScroll";
import { api } from "../lib/api";
import { ChapterView } from "../components/ChapterView";
import { BookChapterSelector } from "../components/BookChapterSelector";
import { ChapterNav } from "../components/ChapterNav";
import { LiveStats } from "../components/LiveStats";
import { CompletionModal } from "../components/CompletionModal";
import { BookmarkPrompt } from "../components/BookmarkPrompt";
import { ChapterRecord, type ChapterCompletionRecord } from "../components/ChapterRecord";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import { useLanguage } from "../i18n/LanguageContext";
import "./ReadPage.css";

const TRANSLATIONS = [nivEn, krvKo];

export function ReadPage() {
  const params = useParams<{ translationId: string; bookId: string; chapter: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const translationId = params.translationId ?? nivEn.id;
  const bookId = params.bookId ?? nivEn.books[0].id;
  const chapter = Number(params.chapter) || 1;

  const currentTranslation = TRANSLATIONS.find((t) => t.id === translationId) ?? TRANSLATIONS[0];
  const currentBook = currentTranslation.books.find((b) => b.id === bookId) ?? currentTranslation.books[0];
  const currentBookIndex = currentTranslation.books.findIndex((b) => b.id === currentBook.id);

  const { data, loading, error } = useChapter(currentTranslation.id, currentBook.id, chapter);
  const verses = data?.verses ?? [];

  const { manualAdvance, wordProcessorMode } = useEnvironment();
  const { playError, playCompletion } = useSound();

  const { session, handleInput, commitComposition, reset, advance } = useTypingSession(
    verses,
    currentTranslation.language,
    manualAdvance
  );
  const [isComposing, setIsComposing] = useState(false);
  const compositionBaselineRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chapterNavRef = useRef<HTMLDivElement>(null);

  // Word-processor mode's cursor position, mirrored from the hidden
  // input's real selectionStart. Off (wordProcessorMode: false), the
  // cursor is implicitly always session.typed.length (end of string) -
  // same as before this feature existed - so this state is simply unused
  // in that mode; VerseRow falls back to typed.length whenever cursorPos
  // is null.
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  useEffect(() => {
    if (!wordProcessorMode) {
      setCursorPos(null);
      return;
    }
    const el = inputRef.current;
    if (!el) return;

    const syncCursor = () => {
      if (document.activeElement !== el) return;
      setCursorPos(el.selectionStart);
    };
    // `select` fires on the <input>/<textarea> element itself whenever its
    // own selectionStart/selectionEnd moves - from typing, arrow keys,
    // Home/End, or a click - which is exactly what "the caret should move
    // with the text and with arrow keys" needs. Document-level
    // `selectionchange` (what this used to listen for) tracks the
    // *document's* Selection object instead, which is a separate thing
    // from a form control's internal caret and doesn't fire for it - that
    // mismatch is why the caret used to sit frozen wherever it was last
    // clicked instead of following each keystroke.
    el.addEventListener("select", syncCursor);
    return () => el.removeEventListener("select", syncCursor);
  }, [wordProcessorMode]);

  // A cursor position is only meaningful relative to the verse it was
  // measured in. Without this, moving to the next verse (by finishing it
  // or advancing) kept whatever index the caret was last at in the
  // *previous* verse's text, so e.g. clicking position 10 then finishing
  // the verse left the caret sitting at index 10 of the new verse instead
  // of resetting like a fresh line normally would. Falling back to null
  // here means VerseRow uses typed.length for the new verse, same as if
  // word processor mode had never touched it.
  useEffect(() => {
    if (wordProcessorMode) setCursorPos(null);
  }, [wordProcessorMode, session.verseIndex]);

  // Blink-interrupt: native carets stop blinking and stay solid while
  // you're actively typing or moving the cursor, then resume blinking
  // after a brief idle pause. caretMoving is that "solid" window -
  // VerseRow suspends its CSS blink animation while this is true (see
  // .caretMoving in index.css) and every place below that actually moves
  // the caret (typing, arrow keys, clicking a character) resets the
  // timer rather than just setting it once, so a run of quick keystrokes
  // keeps it solid the whole time instead of flickering mid-motion.
  const [caretMoving, setCaretMoving] = useState(false);
  const caretMovingTimeoutRef = useRef<number | null>(null);
  const triggerCaretMoving = () => {
    setCaretMoving(true);
    if (caretMovingTimeoutRef.current !== null) window.clearTimeout(caretMovingTimeoutRef.current);
    caretMovingTimeoutRef.current = window.setTimeout(() => setCaretMoving(false), 500);
  };
  useEffect(() => {
    return () => {
      if (caretMovingTimeoutRef.current !== null) window.clearTimeout(caretMovingTimeoutRef.current);
    };
  }, []);

  // Word-processor mode's click-to-position: VerseRow's per-character
  // onClick reports which character was clicked, and this is what
  // actually moves the browser's real selection there (setSelectionRange)
  // so it's not just a cosmetic caret - later typing/backspacing genuinely
  // continues from that spot. Sets cursorPos directly rather than waiting
  // on the selectionchange listener above, since focus+setSelectionRange
  // on an element that isn't already focused doesn't reliably fire
  // selectionchange in every browser, and this shouldn't have to guess.
  const handleCharClick = (index: number) => {
    const el = inputRef.current;
    if (!el) return;
    // Clamp to what's actually been typed - the per-character spans cover
    // the whole verse (see VerseRow), so a click past the typed frontier
    // would otherwise report an index the real input can't reach.
    // setSelectionRange itself clamps silently to el.value.length, but
    // without clamping here too, cursorPos (used for rendering) would keep
    // the raw, un-clamped index - a visible caret sitting somewhere the
    // real selection isn't, same confusing mismatch as the vertical-nav
    // case below.
    const clamped = Math.min(index, session.typed.length);
    el.focus({ preventScroll: true });
    el.setSelectionRange(clamped, clamped);
    setCursorPos(clamped);
    triggerCaretMoving();
  };

  // Up/Down visual-line navigation (word processor mode only). A
  // single-line <input> has no native concept of wrapped lines, so this
  // is the spatial hit-testing Gemini's guide called for: find the
  // character whose on-screen box sits on the row above/below and is
  // horizontally closest to the caret's current x-position, using the
  // rendered <span data-char-index> boxes as ground truth instead of
  // trying to recompute line-wrapping ourselves. These spans only exist
  // for the active verse (see VerseRow), so querying the whole document
  // for them is safe - there's only ever one verse rendering them.
  const handleVerticalNav = (direction: 1 | -1) => {
    const spans = Array.from(document.querySelectorAll<HTMLElement>("[data-char-index]"));
    if (spans.length === 0) return;

    const current = Math.min(cursorPos ?? session.typed.length, session.typed.length);
    const currentRect = spans[Math.min(current, spans.length - 1)].getBoundingClientRect();
    const targetX = currentRect.left;

    // Group spans into visual rows by their top offset. Spans are already
    // in DOM/reading order, so each new top value (beyond a small
    // tolerance for sub-pixel jitter) marks the start of the next row.
    const rowTops: number[] = [];
    const rectsByIndex = spans.map((s) => s.getBoundingClientRect());
    for (const rect of rectsByIndex) {
      if (rowTops.length === 0 || Math.abs(rowTops[rowTops.length - 1] - rect.top) > 2) {
        rowTops.push(rect.top);
      }
    }

    const currentRowIndex = rowTops.findIndex((top) => Math.abs(top - currentRect.top) <= 2);
    const targetRowIndex = currentRowIndex + direction;
    if (currentRowIndex === -1 || targetRowIndex < 0 || targetRowIndex >= rowTops.length) {
      // No row above the first line / below the last - nothing to do,
      // same as a native input at the first/last line of a textarea.
      return;
    }
    const targetTop = rowTops[targetRowIndex];

    let bestIndex = current;
    let bestDist = Infinity;
    rectsByIndex.forEach((rect, i) => {
      if (Math.abs(rect.top - targetTop) > 2) return;
      const dist = Math.abs(rect.left - targetX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    });

    // Same clamp as handleCharClick: the spans being hit-tested cover the
    // whole verse, but the caret shouldn't be placeable past what's
    // actually been typed - visually landing "between" characters that
    // haven't been typed yet would be confusing even though it can't
    // affect the real text (a real caret can never sit past the end of an
    // input's actual value).
    const clampedBest = Math.min(bestIndex, session.typed.length);
    setCursorPos(clampedBest);
    inputRef.current?.setSelectionRange(clampedBest, clampedBest);
    triggerCaretMoving();
  };

  const [modalDismissed, setModalDismissed] = useState(false);
  useEffect(() => {
    setModalDismissed(false);
  }, [translationId, bookId, chapter]);

  // A bookmark prompt open for verse 5 of this chapter means nothing once
  // navigation moves to a different chapter - close it rather than
  // stranding it open pointing at content that's no longer on screen.
  useEffect(() => {
    setBookmarkPromptVerse(null);
  }, [translationId, bookId, chapter]);

  const { saveProgress, loadProgress, isLoggedIn, sessionPending } = useProgress();
  const { saveReadingPosition } = useReadingProgress();
  const { readMode } = useReadMode();

  // Bookmarking - findBookmark/addBookmark/removeBookmark are all no-ops
  // for guests (see useSavedVerses.ts), so isLoggedIn (from useProgress,
  // same underlying session) is what actually gates whether a verse's tap
  // gesture is wired up at all below.
  const { findBookmark, addBookmark, removeBookmark } = useSavedVerses();
  const [bookmarkPromptVerse, setBookmarkPromptVerse] = useState<number | null>(null);

  // Keeps --keyboard-inset in sync with the on-screen keyboard's height so
  // #secondBody (below) can reserve that much bottom padding - without it,
  // a verse near the end of a chapter has nowhere left in the document to
  // scroll to, so no amount of scroll math can lift it above the keyboard.
  useKeyboardInsetVar();

  // Autofocus the (visually hidden) typing input on landing so people can
  // start typing immediately without clicking first. This can't just key
  // off [bookId, chapter]: useChapter starts every navigation with
  // loading:true, and on a fresh mount the <input> below doesn't exist yet
  // at that point (ReadPage is still rendering the loading placeholder),
  // so inputRef.current is null when the effect first runs. Keying off
  // `data` handles that — but it's not enough on its own: right after
  // navigating to a new chapter (e.g. "Next Chapter" from the completion
  // modal), `session.endTime` still holds the *previous* chapter's value
  // until the hydration effect below's async loadProgress(...) resolves
  // and calls reset(). Until then the new chapter's input renders
  // disabled={chapterDone}, and calling .focus() on a disabled input is a
  // silent no-op. For guests loadProgress resolves fast enough that this
  // window is easy to miss; for a signed-in account it's a real API call,
  // so the gap is wide enough to actually see the input never focus. Using
  // session.endTime as a dependency (instead of just `data`) makes this
  // effect re-fire once hydration actually clears that stale endTime, so
  // it retries right when the input becomes enabled. It still only runs on
  // navigation, not on every keystroke re-render, so it never fights the
  // book/chapter <select>s for focus the way an HTML `autoFocus` attribute
  // previously did.
  useEffect(() => {
    if (readMode || !data || session.endTime !== null) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [bookId, chapter, data, readMode, session.endTime]);

  // Every chapter switch needs one hydration pass: fetch whatever was saved
  // for THIS specific chapter, then initialize the typing session from it
  // instead of always starting blank. hydratedRef gates both "don't
  // hydrate twice for the same chapter" and "don't let the save effect
  // below fire before hydration has actually happened" (which would
  // overwrite real saved progress with a blank state). None of this runs
  // in read mode — there's no typing session to hydrate or save there.
  const hydratedRef = useRef(false);
  useEffect(() => {
    hydratedRef.current = false;
    // Clear the session the instant navigation happens - don't wait for
    // the async hydration effect below to resolve. This component doesn't
    // unmount between chapter navigations, so without this, a *previous*
    // chapter's stale chapterDone/startTime would still be sitting in
    // session state for a beat after the new chapter's data has already
    // loaded (loadProgress below is a real fetch and takes a moment) -
    // which momentarily flashes the completion modal back up with the old
    // chapter's stats before hydration finally clears it. Resetting here
    // means the new chapter starts genuinely blank immediately, and the
    // hydration effect below then fills in the *real* saved position (or
    // leaves it blank) shortly after - same as it always did, just no
    // longer with stale leftovers visible in between.
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationId, bookId, chapter]);

  useEffect(() => {
    if (!data || hydratedRef.current || readMode || sessionPending) return;
    let cancelled = false;

    loadProgress(translationId, bookId, chapter).then((resume) => {
      if (cancelled) return;
      reset(
        resume
          ? {
              verseIndex: resume.verseIndex,
              typed: resume.typedSoFar,
              elapsedMs: resume.elapsedMs,
              correctKeystrokes: resume.correctKeystrokes,
              totalKeystrokes: resume.totalKeystrokes,
            }
          : undefined
      );
      hydratedRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [data, translationId, bookId, chapter, loadProgress, reset, readMode, sessionPending]);

  // Save current position any time it actually changes: new verse, or
  // still typing within the current one. Gated on hydratedRef so this
  // never fires with the pre-hydration blank state and stomps real saved
  // progress the instant a chapter loads.
  //
  // Also skipped when hydration just resumed an *already-finished* chapter:
  // useTypingSession.reset() blanks `typed` to "" for display purposes in
  // that case (endTime set, startTime still null - nothing typed yet this
  // sitting), but that blank is cosmetic, not a real position. Persisting
  // it would overwrite the saved "fully typed last verse" record with an
  // empty one, so the next time this chapter loads it no longer looks
  // complete - the reader lands back on the last verse being asked to
  // retype it, and finishing that one verse re-fires the completion POST
  // and inflates timesCompleted for a chapter they never actually retyped.
  // A genuine fresh completion (or a deliberate Retype) always has
  // startTime set to something (typing happened) or endTime cleared
  // entirely, so neither of those is caught by this guard.
  useEffect(() => {
    if (!data || !hydratedRef.current || readMode) return;
    if (session.endTime !== null && session.startTime === null) return;
    // Persist the running total (whatever was carried in from a previous
    // sitting, plus this sitting's own progress so far) rather than just
    // this sitting's numbers - otherwise every subsequent save would
    // clobber the carried-in baseline instead of building on it, and a
    // third sitting would only ever see the second sitting's contribution.
    // While actively typing (startTime set, endTime not) this sitting's
    // own elapsed time is measured live same as LiveStats/finalStats -
    // pause-adjusted the same way, capped the same way against an
    // in-progress pause - so a save mid-pause doesn't bank the ongoing
    // idle stretch as if it were typing time.
    const activityBaseline = session.lastActivityAt ?? session.startTime;
    const cappedNow =
      activityBaseline !== null ? Math.min(Date.now(), activityBaseline + PAUSE_THRESHOLD_MS) : Date.now();
    const sittingElapsedMs = session.startTime
      ? (session.endTime ?? cappedNow) - session.startTime - session.pausedMs
      : 0;

    saveProgress(translationId, bookId, chapter, {
      verseIndex: session.verseIndex,
      typedSoFar: session.typed,
      elapsedMs: session.baseElapsedMs + sittingElapsedMs,
      correctKeystrokes: session.baseCorrectKeystrokes + session.correctKeystrokes,
      totalKeystrokes: session.baseTotalKeystrokes + session.totalKeystrokes,
    });
  }, [
    translationId,
    bookId,
    chapter,
    session.verseIndex,
    session.typed,
    session.startTime,
    session.endTime,
    session.correctKeystrokes,
    session.totalKeystrokes,
    session.pausedMs,
    session.lastActivityAt,
    session.baseElapsedMs,
    session.baseCorrectKeystrokes,
    session.baseTotalKeystrokes,
    data,
    saveProgress,
    readMode,
  ]);

  // Read mode's own progress: just "which chapter", saved the moment the
  // chapter loads — no hydration pass needed since there's no cursor to
  // restore, the URL itself already says which chapter you're looking at.
  useEffect(() => {
    if (!data || !readMode) return;
    saveReadingPosition(translationId, bookId, chapter);
  }, [data, readMode, translationId, bookId, chapter, saveReadingPosition]);

  // This user's completion record for the chapter currently on screen —
  // powers the Record card below. Guests never have one (no account to
  // attach it to), and it's refetched on every chapter navigation since
  // it's keyed to translationId/bookId/chapter, not just bookId/chapter.
  const [chapterRecord, setChapterRecord] = useState<ChapterCompletionRecord | null>(null);
  useEffect(() => {
    setChapterRecord(null);
    if (!isLoggedIn) return;
    let cancelled = false;
    api
      .get<ChapterCompletionRecord>(`/completions/${translationId}/${bookId}/${chapter}`)
      .then((row) => {
        if (!cancelled) setChapterRecord(row);
      })
      .catch((err) => console.error("Failed to load chapter record", err));
    return () => {
      cancelled = true;
    };
  }, [translationId, bookId, chapter, isLoggedIn]);

  const chapterDone = session.endTime !== null;
  // session.startTime only gets set by actually typing (see
  // useTypingSession). A chapter resumed already-complete from a previous
  // sitting has startTime: null, so this correctly skips the modal for
  // that case while still showing it the moment someone genuinely finishes
  // a chapter right now.
  const showCompletionModal = chapterDone && session.startTime !== null && !modalDismissed;

  // Log the completion to the account (times completed, running wpm/accuracy
  // average, streak) exactly once per finish. completionSubmittedRef keeps a
  // re-render from firing this twice, and it's skipped entirely for guests —
  // there's nothing to attach a completion to without an account.
  const completionSubmittedRef = useRef(false);
  useEffect(() => {
    completionSubmittedRef.current = false;
  }, [translationId, bookId, chapter]);

  useEffect(() => {
    if (!chapterDone || session.startTime === null || completionSubmittedRef.current) return;
    if (!isLoggedIn) return;
    completionSubmittedRef.current = true;

    // Pause-adjusted, same as LiveStats and the completion card below -
    // session.pausedMs already reflects every pause up through the final
    // keystroke, so this is the exact wall-clock time actually spent
    // typing, not counting idle stretches over 5s. Plus whatever baseline
    // carried in from earlier sittings on this chapter, so a chapter
    // finished across several sittings reports its true whole-chapter
    // speed/accuracy rather than just this final sitting's contribution.
    const elapsedMs = session.baseElapsedMs + (session.endTime! - session.startTime - session.pausedMs);
    const stats = computeTypingStats(
      session.baseCorrectKeystrokes + session.correctKeystrokes,
      session.baseTotalKeystrokes + session.totalKeystrokes,
      elapsedMs,
      currentTranslation.language
    );
    api
      .post<{ completion: ChapterCompletionRecord }>("/completions", {
        translationId,
        bookId,
        chapter,
        wpm: stats.speed,
        accuracy: stats.accuracy,
        unit: stats.label === "타/분" ? "cpm" : "wpm",
      })
      .then((res) => {
        if (res) setChapterRecord(res.completion);
      })
      .catch((err) => console.error("Failed to log completion", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterDone, session.startTime]);

  useEffect(() => {
    if (chapterDone) {
      scrollAboveKeyboard(chapterNavRef.current);
    }
  }, [chapterDone]);

  // Completion sound - fires once, the moment the completion panel
  // actually shows (not just whenever chapterDone flips true, which also
  // happens for a chapter resumed already-finished from a previous
  // sitting - see showCompletionModal's own comment above). Separate from
  // completionSubmittedRef since this has nothing to do with logging stats
  // to an account and should fire for guests too.
  const completionSoundPlayedRef = useRef(false);
  useEffect(() => {
    completionSoundPlayedRef.current = false;
  }, [translationId, bookId, chapter]);
  useEffect(() => {
    if (!showCompletionModal || completionSoundPlayedRef.current) return;
    completionSoundPlayedRef.current = true;
    playCompletion();
  }, [showCompletionModal, playCompletion]);

  const goToChapter = (next: { translationId: string; bookId: string; chapter: number }) => {
    navigate(`/read/${next.translationId}/${next.bookId}/${next.chapter}`);
  };

  const stepChapter = (direction: 1 | -1) => {
    const targetChapter = chapter + direction;

    if (targetChapter >= 1 && targetChapter <= currentBook.versesPerChapter.length) {
      goToChapter({ translationId, bookId, chapter: targetChapter });
      return;
    }

    const targetBook = currentTranslation.books[currentBookIndex + direction];
    if (!targetBook) return;

    const targetBookChapter = direction === 1 ? 1 : targetBook.versesPerChapter.length;
    goToChapter({ translationId, bookId: targetBook.id, chapter: targetBookChapter });
  };

  const isAtStart = currentBookIndex === 0 && chapter === 1;
  const isAtEnd =
    currentBookIndex === currentTranslation.books.length - 1 &&
    chapter === currentBook.versesPerChapter.length;

  const handleModalContinue = () => {
    if (isAtEnd) {
      setModalDismissed(true);
    } else {
      stepChapter(1);
    }
  };

  // Manual "go back and rewrite" escape hatch: a finished chapter (whether
  // just now or resumed from a prior sitting) blocks the input since
  // there's nowhere left to type. This clears the session back to blank so
  // they can deliberately retype it; the save effect above then persists
  // that reset the next tick, same as any other position change.
  const handleRetype = () => {
    reset();
    setModalDismissed(false);
  };

  const handleVerseActivate = (verseNumber: number) => {
    setBookmarkPromptVerse(verseNumber);
  };

  const existingBookmark =
    bookmarkPromptVerse !== null ? findBookmark(translationId, bookId, chapter, bookmarkPromptVerse) : null;

  const handleBookmarkConfirm = async () => {
    if (bookmarkPromptVerse === null) return;
    try {
      if (existingBookmark) {
        await removeBookmark(existingBookmark.id);
      } else {
        await addBookmark(translationId, bookId, chapter, bookmarkPromptVerse);
      }
    } catch (err) {
      console.error("Couldn't update that bookmark", err);
    } finally {
      setBookmarkPromptVerse(null);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  if (loading) return <div id="mainBody">{t("common.loading")}</div>;
  if (error || !data)
    return (
      <div id="mainBody">
        {t("read.loadErrorPrefix")} {error}
      </div>
    );

  // Pause-adjusted (see useTypingSession.pausedMs) so the completion card
  // shows the exact same number the live counter was already displaying
  // right before this chapter finished, rather than a different,
  // real-wall-clock figure that includes idle time as if it were typing.
  const elapsedMs =
    session.startTime && session.endTime
      ? session.baseElapsedMs + (session.endTime - session.startTime - session.pausedMs)
      : 0;
  const finalStats = computeTypingStats(
    session.baseCorrectKeystrokes + session.correctKeystrokes,
    session.baseTotalKeystrokes + session.totalKeystrokes,
    elapsedMs,
    currentTranslation.language
  );
  const isKorean = currentTranslation.language === "ko";

  return (
    <div id="mainBody">
      {!readMode && (
        <LiveStats
          startTime={session.startTime}
          endTime={session.endTime}
          correctKeystrokes={session.correctKeystrokes}
          totalKeystrokes={session.totalKeystrokes}
          lastActivityAt={session.lastActivityAt}
          pausedMs={session.pausedMs}
          language={currentTranslation.language}
          baseElapsedMs={session.baseElapsedMs}
          baseCorrectKeystrokes={session.baseCorrectKeystrokes}
          baseTotalKeystrokes={session.baseTotalKeystrokes}
        />
      )}

      <BookChapterSelector
        translations={TRANSLATIONS}
        translationId={currentTranslation.id}
        bookId={currentBook.id}
        chapter={chapter}
        onChange={goToChapter}
      />

      <div
        id="secondBody"
        onClick={() => !readMode && inputRef.current?.focus({ preventScroll: true })}
        style={!readMode ? { paddingBottom: "var(--keyboard-inset, 0px)" } : undefined}
      >
        <h2 className="bookText">
          {currentBook.name} {isKorean ? `${chapter}장` : `Chapter ${chapter}`}
        </h2>

        <ChapterView
          verses={verses}
          verseIndex={readMode ? verses.length : session.verseIndex}
          typed={readMode ? "" : session.typed}
          completedCount={readMode ? verses.length : session.completedTyped.length}
          chapterDone={readMode ? true : chapterDone}
          isComposing={isComposing}
          language={currentTranslation.language}
          isVerseBookmarked={
            isLoggedIn
              ? (verseNumber) => !!findBookmark(translationId, bookId, chapter, verseNumber)
              : undefined
          }
          onVerseActivate={isLoggedIn ? handleVerseActivate : undefined}
          cursorPos={wordProcessorMode ? cursorPos : undefined}
          onCharClick={wordProcessorMode ? handleCharClick : undefined}
          caretMoving={wordProcessorMode ? caretMoving : undefined}
        />

        {!readMode && (
          <input
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
            data-lpignore="true"
            ref={inputRef}
            value={chapterDone ? "" : session.typed}
            onChange={(e) => {
              const el = e.currentTarget;
              const raw = el.value;
              let valueForSession = raw;
              // Set below when the transform overwrites a mid-string slot,
              // so the error-sound check further down knows which index
              // was actually just typed rather than assuming it's the
              // last character of `raw` (true for a plain append, not
              // true for an overwrite).
              let overwriteInsertIndex: number | null = null;

              // Word processor mode lets someone click/arrow back into the
              // middle of what's already typed. A native <input> handles
              // that as a normal insert/delete, which shifts every
              // character after the edit point - that's what was
              // desyncing the correction colouring from the real text
              // (everything after the edit point compares against the
              // wrong verse letter once it's shifted) and, since the
              // caret's own state below only ever gets explicitly moved by
              // a click or by this handler, left the caret rendering one
              // step behind reality once an edit like that happened.
              // Instead, treat a single-character change strictly *inside*
              // what was already typed as an overwrite in place: same
              // length in and out, nothing after the edit point moves.
              //
              // A plain append (typing at the very end) or a plain
              // backspace at the very end isn't touched here - `raw`
              // passes straight through, exactly as before.
              if (wordProcessorMode && !isComposing) {
                const prevTyped = session.typed;
                let editIndex = 0;

                if (raw.length === prevTyped.length + 1) {
                  // Single character inserted somewhere. Find where `raw`
                  // first diverges from what was typed before - that's the
                  // insertion point.
                  while (editIndex < prevTyped.length && raw[editIndex] === prevTyped[editIndex]) editIndex++;
                  if (editIndex < prevTyped.length) {
                    // Mid-string: overwrite that one slot, drop the
                    // shifted tail `raw` grew by, keep everyone else in
                    // place.
                    valueForSession = prevTyped.slice(0, editIndex) + raw[editIndex] + prevTyped.slice(editIndex + 1);
                    el.value = valueForSession;
                    el.setSelectionRange(editIndex + 1, editIndex + 1);
                    setCursorPos(editIndex + 1);
                    overwriteInsertIndex = editIndex;
                  }
                } else if (raw.length === prevTyped.length - 1) {
                  // Single character deleted somewhere. Find where `raw`
                  // first diverges from what was typed before - that's the
                  // deleted slot.
                  while (editIndex < raw.length && raw[editIndex] === prevTyped[editIndex]) editIndex++;
                  if (editIndex < raw.length) {
                    // Mid-string delete: rather than shrinking (which
                    // shifts the tail left, misaligning it against the
                    // verse), mark that one slot untyped in place so it
                    // renders as if it had never been typed - ready to be
                    // retyped - and nothing after it moves.
                    valueForSession =
                      prevTyped.slice(0, editIndex) + UNTYPED_MARKER + prevTyped.slice(editIndex + 1);
                    el.value = valueForSession;
                    el.setSelectionRange(editIndex, editIndex);
                    setCursorPos(editIndex);
                  }
                }
              }

              // Error sound - fires once per newly-typed character that
              // doesn't match the verse, whether it landed at the end (the
              // common case, and the only case outside word processor
              // mode) or was overwritten mid-string above. Deletions never
              // reach here (raw only shrinks on a delete, never grows by
              // exactly one), and mid-composition Korean input is skipped
              // the same way scoring skips it - a syllable isn't "wrong"
              // until it's actually finished.
              if (!isComposing && raw.length === session.typed.length + 1) {
                const currentVerse = verses[session.verseIndex];
                const typedIndex = overwriteInsertIndex ?? raw.length - 1;
                if (currentVerse && typedIndex < currentVerse.length) {
                  const typedChar = valueForSession[typedIndex];
                  if (!charMatches(typedChar, currentVerse[typedIndex], currentTranslation.language)) {
                    playError();
                  }
                }
              }

              handleInput(valueForSession, isComposing);
              if (wordProcessorMode) triggerCaretMoving();
            }}
            onPaste={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              // The input is visually hidden - all rendering comes from
              // `typed`/cursor position in VerseRow, not from where the
              // browser's real caret sits inside this field. Without word
              // processor mode there's no visible cursor tracking to move,
              // so Left/Right would silently strand future keystrokes
              // mid-string - block them outright. With it on, the cursor
              // effect above mirrors selectionStart into VerseRow, so the
              // browser's native Left/Right (and Up/Down, see VerseRow) can
              // be trusted to move something the person can actually see.
              // ArrowUp gets the same block as Left/Right (not just
              // Left/Right alone, as before) since a single-line <input>'s
              // default behavior for it is to jump to the very start of the
              // value - just as disorienting as Left/Right silently
              // stranding future keystrokes mid-string would be.
              if (!wordProcessorMode && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp")) {
                e.preventDefault();
              }

              // Up/Down has no native meaning in a single-line input at
              // all (word processor mode or not) - it never moves
              // anything on its own, so it's handled entirely here via
              // spatial hit-testing against the rendered character spans.
              // Left/Right/Home/End are left to the browser's own native
              // handling (see the comment above) since a real <input>
              // already tracks those correctly; this just needs to keep
              // the visual caret's blink-interrupt in sync with them too.
              if (wordProcessorMode) {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  handleVerticalNav(e.key === "ArrowUp" ? -1 : 1);
                } else if (
                  e.key === "ArrowLeft" ||
                  e.key === "ArrowRight" ||
                  e.key === "Home" ||
                  e.key === "End"
                ) {
                  triggerCaretMoving();
                }
              }

              // manualAdvance's explicit "go to next verse" gesture. Only
              // meaningful once the current verse is already fully correct
              // (advance() itself is a no-op otherwise) - this just wires
              // the two keys someone would naturally reach for. Gating the
              // preventDefault itself on verse-complete (not just on
              // manualAdvance being on) is what lets Space keep typing
              // normally as a real character everywhere else in the verse -
              // previously this fired unconditionally whenever manualAdvance
              // was on, which silently ate every space keystroke typed
              // *within* a verse (the browser never even got the keystroke)
              // rather than just the one that finishes it. Once the verse
              // *is* complete, `typed` is already sitting at
              // currentVerse.length, so a raw space there would otherwise
              // just scroll the page - still worth preventDefault there.
              const currentVerseText = verses[session.verseIndex];
              const verseIsComplete =
                !!currentVerseText && matchesFully(session.typed, currentVerseText, currentTranslation.language);
              if (manualAdvance && verseIsComplete && (e.key === " " || e.key === "Enter")) {
                e.preventDefault();
                advance();
              }
            }}
            onCompositionStart={() => {
              compositionBaselineRef.current = session.typed;
              setIsComposing(true);
            }}
            onCompositionEnd={(e) => {
              setIsComposing(false);
              const baseline = compositionBaselineRef.current;
              const value = e.currentTarget.value;

              // Korean input finalizes a whole syllable at once here
              // (compositionend), not per-keystroke like English - this is
              // the same moment VerseRow's colouring turns a syllable red
              // (commitComposition below is what scores it), so it's the
              // right moment for the error sound too rather than the
              // onChange check above, which skips anything mid-composition.
              const currentVerse = verses[session.verseIndex];
              if (currentVerse && value.length > baseline.length && value.startsWith(baseline)) {
                for (let i = baseline.length; i < value.length; i++) {
                  if (i < currentVerse.length && !charMatches(value[i], currentVerse[i], currentTranslation.language)) {
                    playError();
                    break; // one sound is enough even if a syllable finalizes into more than one character
                  }
                }
              }

              commitComposition(baseline, value);
            }}
            disabled={chapterDone}
            style={{ position: "fixed", top: 0, left: 0, opacity: 0, pointerEvents: "none" }}
          />
        )}

        <div ref={chapterNavRef}>
          <ChapterNav
            onPrev={() => stepChapter(-1)}
            onNext={() => stepChapter(1)}
            disablePrev={isAtStart}
            disableNext={isAtEnd}
          />
          {!readMode && chapterDone && (
            <button type="button" onClick={handleRetype} className="retypeButton">
              {isKorean ? "다시 쓰기" : "Retype this chapter"}
            </button>
          )}
        </div>

        <ChapterRecord record={chapterRecord} />
      </div>

      {!readMode && showCompletionModal && (
        <CompletionModal
          speed={finalStats.speed}
          accuracy={finalStats.accuracy}
          speedLabel={finalStats.label}
          language={currentTranslation.language}
          onContinue={handleModalContinue}
          continueLabel={isAtEnd ? (isKorean ? "닫기" : "Close") : isKorean ? "다음 장" : "Next Chapter"}
          extras={
            <div className="completionLinks">
              {isLoggedIn && (
                <Link to="/profile" className="completionLink">
                  {isKorean ? "내 프로필" : "My Profile"}
                </Link>
              )}
              <Link to="/" className="completionLink">
                {isKorean ? "홈으로" : "Home"}
              </Link>
            </div>
          }
        />
      )}

      {bookmarkPromptVerse !== null && (
      <BookmarkPrompt
        verseNumber={bookmarkPromptVerse}
        isBookmarked={!!existingBookmark}
        onConfirm={handleBookmarkConfirm}
        onCancel={() => {
          setBookmarkPromptVerse(null);
          inputRef.current?.focus({ preventScroll: true });
        }}
      />
      )}
    </div>
  );
}