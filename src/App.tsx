import { useEffect, useRef, useState } from "react";
import { useChapter } from "./hooks/useChapter";
import { useTypingSession } from "./hooks/useTypingSession";
import { ChapterView } from "./components/ChapterView";
import { BookChapterSelector } from "./components/BookChapterSelector";
import { ChapterNav } from "./components/ChapterNav";
import { LiveStats } from "./components/LiveStats";
import { meta as nivEn } from "./bible-data/translations/niv-en/meta";
import { meta as krvKo } from "./bible-data/translations/krv-ko/meta";

const TRANSLATIONS = [nivEn, krvKo];

function App() {
  const [translationId, setTranslationId] = useState(nivEn.id);
  const [bookId, setBookId] = useState(nivEn.books[0].id);
  const [chapter, setChapter] = useState(1);

  const currentTranslation = TRANSLATIONS.find((t) => t.id === translationId) ?? TRANSLATIONS[0];
  const currentBook = currentTranslation.books.find((b) => b.id === bookId) ?? currentTranslation.books[0];
  const currentBookIndex = currentTranslation.books.findIndex((b) => b.id === currentBook.id);

  const { data, loading, error } = useChapter(translationId, bookId, chapter);
  const verses = data?.verses ?? [];

  const { session, handleInput, commitComposition, reset } = useTypingSession(
    verses,
    currentTranslation.language
  );
  const [isComposing, setIsComposing] = useState(false);
  const compositionBaselineRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chapterNavRef = useRef<HTMLDivElement>(null);

  // New chapter/book/translation -> fresh typing session.
  useEffect(() => {
    reset();
  }, [translationId, bookId, chapter, reset]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [bookId, chapter]);

  const chapterDone = session.endTime !== null;

  useEffect(() => {
    // Bring the nav buttons / completion state into view once the last
    // verse is finished, same "page down" behavior as advancing verses.
    if (chapterDone) {
      chapterNavRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chapterDone]);

  const goToChapter = (next: { translationId: string; bookId: string; chapter: number }) => {
    setTranslationId(next.translationId);
    setBookId(next.bookId);
    setChapter(next.chapter);
  };

  // Shared by the nav buttons and Enter/Shift+Enter: steps a chapter within
  // the current book, or rolls over into the next/previous book once one exists.
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    stepChapter(e.shiftKey ? -1 : 1);
  };

  if (loading) return <div id="mainBody">Loading…</div>;
  if (error || !data) return <div id="mainBody">Couldn't load this chapter. {error}</div>;

  return (
    <div id="mainBody">
      <LiveStats
        startTime={session.startTime}
        endTime={session.endTime}
        correctKeystrokes={session.correctKeystrokes}
        totalKeystrokes={session.totalKeystrokes}
        language={currentTranslation.language}
      />

      <BookChapterSelector
        translations={TRANSLATIONS}
        translationId={translationId}
        bookId={bookId}
        chapter={chapter}
        onChange={goToChapter}
      />

      <div id="secondBody" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
        <h2 className="bookText">
          {currentBook.name} {chapter}장
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
          onKeyDown={handleKeyDown}
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
    </div>
  );
}

export default App;
