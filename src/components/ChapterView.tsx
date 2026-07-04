import { VerseRow } from "./VerseRow";

interface ChapterViewProps {
  verses: string[];
  verseIndex: number;
  typed: string;
  completedCount: number;
  chapterDone: boolean;
  isComposing: boolean;
}

export function ChapterView({
  verses,
  verseIndex,
  typed,
  completedCount,
  chapterDone,
  isComposing,
}: ChapterViewProps) {
  return (
    <>
      {verses.map((verse, i) => {
        const status =
          i < completedCount ? "done" : i === verseIndex && !chapterDone ? "active" : "pending";

        return (
          <VerseRow
            key={i}
            index={i}
            text={verse}
            status={status}
            typed={status === "active" ? typed : undefined}
            isComposing={status === "active" ? isComposing : undefined}
          />
        );
      })}
    </>
  );
}
