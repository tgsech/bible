import { useEffect, useRef, useState } from "react";
import { useChapter } from "./hooks/useChapter";
import { useTypingSession } from "./hooks/useTypingSession";
import { ChapterView } from "./components/ChapterView";
import { BookChapterSelector } from "./components/BookChapterSelector";
import { meta as nivEn } from "./bible-data/translations/niv-en/meta";
import { meta as krvKo } from "./bible-data/translations/krv-ko/meta";

const TRANSLATIONS = [nivEn, krvKo];

function App() {
  const [translationId, setTranslationId] = useState(nivEn.id);
  const [bookId, setBookId] = useState(nivEn.books[0].id);
  const [chapter, setChapter] = useState(1);

  const { data, loading, error } = useChapter(translationId, bookId, chapter);
  const verses = data?.verses ?? [];

  const { session, handleInput, reset } = useTypingSession(verses);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // New chapter/book/translation -> fresh typing session.
  useEffect(() => {
    reset();
  }, [translationId, bookId, chapter, reset]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [bookId, chapter]);

  const chapterDone = session.endTime !== null;
  const totalLetters = verses.join("").length;
  // NOTE: chars/5 is the English WPM convention. Korean needs its own formula
  // based on keystrokes (자소 단위) rather than characters - that's part of
  // the KR/EN engine split, not this pass.
  const wpm =
    session.startTime && session.endTime
      ? Math.round(totalLetters / 5 / ((session.endTime - session.startTime) / 1000 / 60))
      : null;

  const goToChapter = (next: { translationId: string; bookId: string; chapter: number }) => {
    setTranslationId(next.translationId);
    setBookId(next.bookId);
    setChapter(next.chapter);
  };

  const currentTranslation = TRANSLATIONS.find((t) => t.id === translationId) ?? TRANSLATIONS[0];
  const currentBook = currentTranslation.books.find((b) => b.id === bookId) ?? currentTranslation.books[0];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const nextChapter = chapter + (e.shiftKey ? -1 : 1);
    if (nextChapter >= 1 && nextChapter <= currentBook.versesPerChapter.length) {
      goToChapter({ translationId, bookId, chapter: nextChapter });
    }
    // TODO: once each translation's meta.ts lists its full set of books,
    // wrap to the previous/next book here the same way the old code did.
  };

  if (loading) return <div id="mainBody">Loading…</div>;
  if (error || !data) return <div id="mainBody">Couldn't load this chapter. {error}</div>;

  return (
    <div id="mainBody">
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
        />

        <input
          ref={inputRef}
          value={chapterDone ? "" : session.typed}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={chapterDone}
          style={{ position: "fixed", top: 0, left: 0, opacity: 0, pointerEvents: "none" }}
        />
        {chapterDone && <p>WPM: {wpm}</p>}
      </div>
    </div>
  );
}

export default App;
