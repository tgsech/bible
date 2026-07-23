import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useChapter } from "../hooks/useChapter";
import { useTypingSession } from "../hooks/useTypingSession";
import { useProgress } from "../hooks/useProgress";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { useReadMode } from "../hooks/useReadMode";
import { computeTypingStats } from "../typing/stats";
import { api } from "../lib/api";
import { ChapterView } from "../components/ChapterView";
import { BookChapterSelector } from "../components/BookChapterSelector";
import { ChapterNav } from "../components/ChapterNav";
import { LiveStats } from "../components/LiveStats";
import { CompletionModal } from "../components/CompletionModal";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import "./ReadPage.css";

const TRANSLATIONS = [nivEn, krvKo];

export function ReadPage() {
  const params = useParams<{ translationId: string; bookId: string; chapter: string }>();
  const navigate = useNavigate();

  const translationId = params.translationId ?? nivEn.id;
  const bookId = params.bookId ?? nivEn.books[0].id;
  const chapter = Number(params.chapter) || 1;

  const currentTranslation = TRANSLATIONS.find((t) => t.id === translationId) ?? TRANSLATIONS[0];
  const currentBook = currentTranslation.books.find((b) => b.id === bookId) ?? currentTranslation.books[0];
  const currentBookIndex = currentTranslation.books.findIndex((b) => b.id === currentBook.id);

  const { data, loading, error } = useChapter(currentTranslation.id, currentBook.id, chapter);
  const verses = data?.verses ?? [];

  const { session, handleInput, commitComposition, reset } = useTypingSession(
    verses,
    currentTranslation.language
  );
  const [isComposing, setIsComposing] = useState(false);
  const compositionBaselineRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chapterNavRef = useRef<HTMLDivElement>(null);

  const [modalDismissed, setModalDismissed] = useState(false);
  useEffect(() => {
    setModalDismissed(false);
  }, [translationId, bookId, chapter]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [bookId, chapter]);

  const { saveProgress, loadProgress, isLoggedIn } = useProgress();
  const { saveReadingPosition } = useReadingProgress();
  const { readMode, setReadMode } = useReadMode();

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
  }, [translationId, bookId, chapter]);

  useEffect(() => {
    if (!data || hydratedRef.current || readMode) return;
    let cancelled = false;

    loadProgress(translationId, bookId, chapter).then((resume) => {
      if (cancelled) return;
      reset(resume ? { verseIndex: resume.verseIndex, typed: resume.typedSoFar } : undefined);
      hydratedRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [data, translationId, bookId, chapter, loadProgress, reset, readMode]);

  // Save current position any time it actually changes: new verse, or
  // still typing within the current one. Gated on hydratedRef so this
  // never fires with the pre-hydration blank state and stomps real saved
  // progress the instant a chapter loads.
  useEffect(() => {
    if (!data || !hydratedRef.current || readMode) return;
    saveProgress(translationId, bookId, chapter, {
      verseIndex: session.verseIndex,
      typedSoFar: session.typed,
    });
  }, [translationId, bookId, chapter, session.verseIndex, session.typed, data, saveProgress, readMode]);

  // Read mode's own progress: just "which chapter", saved the moment the
  // chapter loads — no hydration pass needed since there's no cursor to
  // restore, the URL itself already says which chapter you're looking at.
  useEffect(() => {
    if (!data || !readMode) return;
    saveReadingPosition(translationId, bookId, chapter);
  }, [data, readMode, translationId, bookId, chapter, saveReadingPosition]);

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

    const elapsedMs = session.endTime! - session.startTime;
    const stats = computeTypingStats(
      session.correctKeystrokes,
      session.totalKeystrokes,
      elapsedMs,
      currentTranslation.language
    );
    api
      .post("/completions", {
        translationId,
        bookId,
        chapter,
        wpm: stats.speed,
        accuracy: stats.accuracy,
        unit: stats.label === "타/분" ? "cpm" : "wpm",
      })
      .catch((err) => console.error("Failed to log completion", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterDone, session.startTime]);

  useEffect(() => {
    if (chapterDone) {
      chapterNavRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  if (loading) return <div id="mainBody">Loading…</div>;
  if (error || !data) return <div id="mainBody">Couldn't load this chapter. {error}</div>;

  const elapsedMs = session.startTime && session.endTime ? session.endTime - session.startTime : 0;
  const finalStats = computeTypingStats(
    session.correctKeystrokes,
    session.totalKeystrokes,
    elapsedMs,
    currentTranslation.language
  );
  const isKorean = currentTranslation.language === "ko";

  return (
    <div id="mainBody">
      <Link to="/" className="backHomeLink">
        ← Home
      </Link>

      {!readMode && (
        <LiveStats
          startTime={session.startTime}
          endTime={session.endTime}
          correctKeystrokes={session.correctKeystrokes}
          totalKeystrokes={session.totalKeystrokes}
          language={currentTranslation.language}
        />
      )}

      <div className="readModeToggleRow">
        <button
          type="button"
          className="readModeToggle"
          onClick={() => setReadMode(!readMode)}
          aria-pressed={readMode}
        >
          {readMode
            ? isKorean
              ? "타이핑 모드로 전환"
              : "Switch to typing mode"
            : isKorean
              ? "읽기 전용 모드로 전환"
              : "Switch to read-only mode"}
        </button>
      </div>

      <BookChapterSelector
        translations={TRANSLATIONS}
        translationId={currentTranslation.id}
        bookId={currentBook.id}
        chapter={chapter}
        onChange={goToChapter}
      />

      <div id="secondBody" onClick={() => !readMode && inputRef.current?.focus({ preventScroll: true })}>
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
        />

        {!readMode && (
          <input
            ref={inputRef}
            value={chapterDone ? "" : session.typed}
            onChange={(e) => handleInput(e.target.value, isComposing)}
            onPaste={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              // The input is visually hidden - all rendering comes from
              // `typed`/cursor position in VerseRow, not from where the
              // browser's real caret sits inside this field. Left/right
              // would move that real caret without moving anything the
              // person can see, so a stray arrow-key tap silently strands
              // future keystrokes mid-string. Block them outright.
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
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
      </div>

      {!readMode && showCompletionModal && (
        <CompletionModal
          speed={finalStats.speed}
          accuracy={finalStats.accuracy}
          speedLabel={finalStats.label}
          language={currentTranslation.language}
          onContinue={handleModalContinue}
          continueLabel={isAtEnd ? (isKorean ? "닫기" : "Close") : isKorean ? "다음 장" : "Next Chapter"}
        />
      )}
    </div>
  );
}