import { useLanguage } from "../i18n/LanguageContext";
import "./ChapterNav.css";

interface ChapterNavProps {
  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
}

export function ChapterNav({ onPrev, onNext, disablePrev, disableNext }: ChapterNavProps) {
  const { t } = useLanguage();
  return (
    <div className="chapterNav">
      <button type="button" onClick={onPrev} disabled={disablePrev}>
        {t("nav.prev")}
      </button>
      <button type="button" onClick={onNext} disabled={disableNext}>
        {t("nav.next")}
      </button>
    </div>
  );
}
