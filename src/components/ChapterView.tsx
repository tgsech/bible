import { useEffect, useRef } from "react";
import { VerseRow } from "./VerseRow";
import { scrollAboveKeyboard, useOnVisualViewportChange } from "../hooks/useKeyboardAwareScroll";

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

  // Whenever the active verse advances (the previous one just got
  // finished), bring the new one into view - scrolling only the minimum
  // distance needed, same "page down once you reach the bottom" feel as
  // scrollIntoView({block: "nearest"}) had. The difference is
  // scrollAboveKeyboard measures against window.visualViewport instead of
  // the full window, so on mobile it stops above the on-screen keyboard
  // instead of scrolling the verse to a spot that's actually hidden behind
  // it (see useKeyboardAwareScroll.ts for why plain scrollIntoView gets
  // this wrong).
  useEffect(() => {
    scrollAboveKeyboard(activeRowRef.current);
  }, [verseIndex]);

  // The keyboard doesn't reach its final height instantly - it animates in
  // over a couple hundred ms after the input is focused. A scroll check
  // made at focus time (or at verseIndex-change time, if that happens to
  // coincide with the keyboard still opening) can run before the keyboard
  // has fully expanded, so it under-corrects. Re-running the same check on
  // every visualViewport resize/scroll event catches the keyboard settling
  // into its final size and any orientation change while typing.
  useOnVisualViewportChange(() => {
    scrollAboveKeyboard(activeRowRef.current, "auto");
  });

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
