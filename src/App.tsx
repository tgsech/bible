import { useState, useRef, useEffect } from "react";
import { bible } from "./verseSample";

function App() {
  const [bookIndex, setBookIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [verseIndex, setVerseIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [completedTyped, setCompletedTyped] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const book = bible[bookIndex];
  const chapter = book.chapters[chapterIndex];
  const currentVerseText = chapter.verses[verseIndex];
  const currentLetters = currentVerseText.split("");
  const chapterDone = endTime !== null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length > currentLetters.length) return;

    if (startTime === null && value.length > 0) {
      setStartTime(Date.now());
    }

    setTyped(value);

    if (value.length === currentLetters.length && value === currentVerseText) {
      const isLastVerse = verseIndex === chapter.verses.length - 1;
      setCompletedTyped((prev) => [...prev, value]);

      if (isLastVerse) {
        setEndTime(Date.now());
      } else {
        setVerseIndex((v) => v + 1);
        setTyped("");
      }
    }
  };

  const goToChapter = (newBookIndex: number, newChapterIndex: number) => {
    setBookIndex(newBookIndex);
    setChapterIndex(newChapterIndex);
    setVerseIndex(0);
    setTyped("");
    setCompletedTyped([]);
    setStartTime(null);
    setEndTime(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (e.shiftKey) {
      if (chapterIndex > 0) {
        goToChapter(bookIndex, chapterIndex - 1);
      } else if (bookIndex > 0) {
        const prevBook = bible[bookIndex - 1];
        goToChapter(bookIndex - 1, prevBook.chapters.length - 1);
      }
    } else {
      if (chapterIndex < book.chapters.length - 1) {
        goToChapter(bookIndex, chapterIndex + 1);
      } else if (bookIndex < bible.length - 1) {
        goToChapter(bookIndex + 1, 0);
      }
    }
  };

  const totalLetters = chapter.verses.join("").length;
  const wpm =
    startTime && endTime
      ? Math.round(totalLetters / 5 / ((endTime - startTime) / 1000 / 60))
      : null;

  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
  inputRef.current?.focus({ preventScroll: true });
}, [bookIndex, chapterIndex]);

  return (
    <div id={"mainBody"}>
      <div id={"bookSelectCont"}>
        <select
          className={"bookSelect"}
          value={bookIndex}
          onChange={(e) => goToChapter(Number(e.target.value), 0)}
        >
          {bible.map((b, i) => (
            <option className={"bookSelect"} key={i} value={i}>{b.book}</option>
          ))}
        </select>

        <select
          className={"bookSelect"}
          value={chapterIndex}
          onChange={(e) => goToChapter(bookIndex, Number(e.target.value))}
        >
          {book.chapters.map((c, i) => (
            <option className={"bookSelect"} key={i} value={i}>{c.chapter}장</option>
          ))}
        </select>
      </div>

      <div id={"secondBody"} onClick={() => inputRef.current?.focus({ preventScroll: true })}>
        <h2 className={"bookText"}>{book.book} {chapter.chapter}장</h2>
        {chapter.verses.map((verse, vIndex) => {
          const letters = verse.split("");
          const isCurrent = vIndex === verseIndex && !chapterDone;
          const isDone = vIndex < completedTyped.length;

          return (
            <div key={vIndex} style={{ display: "flex", gap: "8px", opacity: isCurrent || isDone ? 1 : 0.3 }}>
              <span className={"verseNum"} style={{ color: "gray", minWidth: "20px" }}>{vIndex + 1}</span>
              <div>
                {letters.map((char, index) => {
                  const activeTyped = isCurrent ? typed : completedTyped[vIndex];
                  const composingIndex = isCurrent && isComposing ? typed.length - 1 : -1;
                  const isComposingHere = index === composingIndex;

                  let displayChar = char;
                  let color = "#6f8cdc";

                  if (isComposingHere) {
                    displayChar = activeTyped[index];
                    color = "#001a47"; 
                  } else if (activeTyped && index < activeTyped.length) {
                    color = activeTyped[index] === char ? "black" : "#d7c7ba";
                  } 

                  const showCursor = isCurrent && index === typed.length && !isComposing;

                  return (
                    <span key={index} style={{ position: "relative" }}>
                      {showCursor && (
                        <span
                          style={{
                            position: "absolute",
                            left: -1,
                            bottom: 0.5,
                            width: "2px",
                            height: "2rem",
                            background: "black",
                            animation: "blink 1s step-end infinite",
                          }}
                        />
                      )}
                      <span className={"bibText"} style={{ color }}>{displayChar}</span>
                    </span>
                  );
                })}            
              </div>
            </div>
          );
        })}
        <input
          ref={inputRef}
          value={chapterDone ? "" : typed}
          onChange={handleChange}
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