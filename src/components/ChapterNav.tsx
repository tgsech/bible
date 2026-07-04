import "./ChapterNav.css";

interface ChapterNavProps {
  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
}

export function ChapterNav({ onPrev, onNext, disablePrev, disableNext }: ChapterNavProps) {
  return (
    <div className="chapterNav">
      <button type="button" onClick={onPrev} disabled={disablePrev}>
        ◀ Previous Chapter
      </button>
      <button type="button" onClick={onNext} disabled={disableNext}>
        Next Chapter ▶
      </button>
    </div>
  );
}
