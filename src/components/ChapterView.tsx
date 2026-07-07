import { useEffect, useRef } from "react";
import { VerseRow } from "./VerseRow";

interface ChapterViewProps {
  verses: string[];
  verseIndex: number;
  typed: string;
  completedCount: number;
  chapterDone: boolean;
  isComposing: boolean;
  language: string;
}

export function ChapterView({
  verses,
  verseIndex,
  typed,
  completedCount,
  chapterDone,
  isComposing,
  language,
}: ChapterViewProps) {
  const activeRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Whenever the active verse advances (the previous one just got
    // finished), bring the new one into view. `block: "nearest"` is a no-op
    // if it's already visible and scrolls the minimum distance otherwise -
    // a natural "page down once you reach the bottom" feel rather than
    // jumping around on every single verse.
    activeRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [verseIndex]);

  return (
    <>
      {verses.map((verse, i) => {
        const status =
          i < completedCount ? "done" : i === verseIndex && !chapterDone ? "active" : "pending";
        const isActive = status === "active";

        return (
          <VerseRow
            key={i}
            ref={isActive ? activeRowRef : undefined}
            index={i}
            text={verse}
            status={status}
            typed={isActive ? typed : undefined}
            isComposing={isActive ? isComposing : undefined}
            language={language}
          />
        );
      })}
    </>
  );
}
