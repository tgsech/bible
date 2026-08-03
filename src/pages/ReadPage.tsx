import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useChapter } from "../hooks/useChapter";
import { useTypingSession } from "../hooks/useTypingSession";
import { useProgress } from "../hooks/useProgress";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { useReadMode } from "../hooks/useReadMode";
import { useEnvironment } from "../environment/EnvironmentContext";
import { useSavedVerses } from "../hooks/useSavedVerses";
import { computeTypingStats } from "../typing/stats";
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
  // is null. selectionchange (rather than only onClick/onKeyUp) is what
  // catches every way the browser's own selection can move - including
  // ones this component doesn't have its own handler for.
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
    // selectionchange is document-level, not element-level - the activeElement
    // check above is what keeps it from reacting to selection changes
    // elsewhere on the page (e.g. someone selecting text in a different field).
    document.addEventListener("selectionchange", syncCursor);
    return () => document.removeEventListener("selectionchange", syncCursor);
  }, [wordProcessorMode]);

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
      reset(resume ? { verseIndex: resume.verseIndex, typed: resume.typedSoFar } : undefined);
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
    saveProgress(translationId, bookId, chapter, {
      verseIndex: session.verseIndex,
      typedSoFar: session.typed,
    });
  }, [
    translationId,
    bookId,
    chapter,
    session.verseIndex,
    session.typed,
    session.startTime,
    session.endTime,
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
    // typing, not counting idle stretches over 5s.
    const elapsedMs = session.endTime! - session.startTime - session.pausedMs;
    const stats = computeTypingStats(
      session.correctKeystrokes,
      session.totalKeystrokes,
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
  const elapsedMs = session.startTime && session.endTime ? session.endTime - session.startTime - session.pausedMs : 0;
  const finalStats = computeTypingStats(
    session.correctKeystrokes,
    session.totalKeystrokes,
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
            onChange={(e) => handleInput(e.target.value, isComposing)}
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
              if (!wordProcessorMode && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                e.preventDefault();
              }

              // manualAdvance's explicit "go to next verse" gesture. Only
              // meaningful once the current verse is already fully correct
              // (advance() itself is a no-op otherwise) - this just wires
              // the two keys someone would naturally reach for. Space
              // still needs preventDefault even when advance() ends up
              // being a no-op, since a raw space keystroke on an *already
              // complete* verse has nowhere left to go in `typed` (it's at
              // currentVerse.length) and would otherwise scroll the page.
              if (manualAdvance && (e.key === " " || e.key === "Enter")) {
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
              commitComposition(compositionBaselineRef.current, e.currentTarget.value);
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
