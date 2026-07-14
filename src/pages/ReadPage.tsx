import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useChapter } from "../hooks/useChapter";
import { useTypingSession } from "../hooks/useTypingSession";
import { computeTypingStats } from "../typing/stats";
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

  // New chapter/book/translation -> fresh typing session and a fresh chance
  // to see the completion modal on this chapter.
  const [modalDismissed, setModalDismissed] = useState(false);
  useEffect(() => {
    reset();
    setModalDismissed(false);
  }, [translationId, bookId, chapter, reset]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [bookId, chapter]);

  const chapterDone = session.endTime !== null;
  const showCompletionModal = chapterDone && !modalDismissed;

  useEffect(() => {
    // Bring the nav buttons / completion state into view once the last
    // verse is finished, same "page down" behavior as advancing verses.
    if (chapterDone) {
      chapterNavRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chapterDone]);

  const goToChapter = (next: { translationId: string; bookId: string; chapter: number }) => {
    navigate(`/read/${next.translationId}/${next.bookId}/${next.chapter}`);
  };

  // Shared by the nav buttons and the completion modal's continue action:
  // steps a chapter within the current book, or rolls over into the
  // next/previous book once one exists.
  const stepChapter = (direction: 1 | -1) => {
    const targetChapter = chapter + direction;

    if (targetChapter >= 1 && targetChapter <= currentBook.versesPerChapter.length) {
      goToChapter({ translationId, bookId, chapter: targetChapter });
      return;
    }

    const targetBook = currentTranslation.books[currentBookIndex + direction];
    if (!targetBook) return; // already at the start/end of this translation

    const targetBookChapter = direction === 1 ? 1 : targetBook.versesPerChapter.length;
    goToChapter({ translationId, bookId: targetBook.id, chapter: targetBookChapter });
  };

  const isAtStart = currentBookIndex === 0 && chapter === 1;
  const isAtEnd =
    currentBookIndex === currentTranslation.books.length - 1 &&
    chapter === currentBook.versesPerChapter.length;

  // If there's a next chapter, the modal's continue button advances to it
  // (which also naturally resets modalDismissed via the effect above). If
  // this is the last chapter available, it just closes the modal so the
  // person can review what they typed.
  const handleModalContinue = () => {
    if (isAtEnd) {
      setModalDismissed(true);
    } else {
      stepChapter(1);
    }
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

      <LiveStats
        startTime={session.startTime}
        endTime={session.endTime}
        correctKeystrokes={session.correctKeystrokes}
        totalKeystrokes={session.totalKeystrokes}
        language={currentTranslation.language}
      />

      <BookChapterSelector
        translations={TRANSLATIONS}
        translationId={currentTranslation.id}
        bookId={currentBook.id}
        chapter={chapter}
        onChange={goToChapter}
      />

      <div id="secondBody" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
        <h2 className="bookText">
          {currentBook.name} {isKorean ? `${chapter}장` : `Chapter ${chapter}`}
        </h2>

        <ChapterView
          verses={verses}
          verseIndex={session.verseIndex}
          typed={session.typed}
          completedCount={session.completedTyped.length}
          chapterDone={chapterDone}
          isComposing={isComposing}
          language={currentTranslation.language}
        />

        <input
          ref={inputRef}
          value={chapterDone ? "" : session.typed}
          onChange={(e) => handleInput(e.target.value, isComposing)}
          onPaste={(e) => e.preventDefault()}
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

        <div ref={chapterNavRef}>
          <ChapterNav
            onPrev={() => stepChapter(-1)}
            onNext={() => stepChapter(1)}
            disablePrev={isAtStart}
            disableNext={isAtEnd}
          />
        </div>
      </div>

      {showCompletionModal && (
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
