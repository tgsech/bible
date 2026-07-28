import { useLanguage } from "../i18n/LanguageContext";
import "./ChapterRecord.css";

export interface ChapterCompletionRecord {
  unit: "wpm" | "cpm";
  timesCompleted: number;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
}

interface Props {
  record: ChapterCompletionRecord | null;
}

/**
 * Single-row version of the old profile page's completions table, scoped
 * to whichever chapter is currently on screen — "how have I done on THIS
 * chapter specifically" rather than the full list. Renders nothing if this
 * chapter has never been completed (record is null), same as the table
 * simply omitting a row for it.
 */
export function ChapterRecord({ record }: Props) {
  const { t } = useLanguage();

  if (!record) return null;

  const unitLabel = record.unit === "cpm" ? "타/분" : "WPM";

  return (
    <section className="chapterRecord">
      <h2 className="chapterRecordTitle">{t("read.record")}</h2>
      <div className="chapterRecordGrid">
        <div className="chapterRecordCard">
          <span className="chapterRecordValue">{record.timesCompleted}</span>
          <span className="chapterRecordLabel">{t("read.recordTimesCompleted")}</span>
        </div>
        <div className="chapterRecordCard">
          <span className="chapterRecordValue">
            {record.bestWpm.toFixed(1)} {unitLabel}
          </span>
          <span className="chapterRecordLabel">{t("read.recordBestSpeed")}</span>
        </div>
        <div className="chapterRecordCard">
          <span className="chapterRecordValue">
            {record.avgWpm.toFixed(1)} {unitLabel}
          </span>
          <span className="chapterRecordLabel">{t("read.recordAvgSpeed")}</span>
        </div>
        <div className="chapterRecordCard">
          <span className="chapterRecordValue">{record.avgAccuracy.toFixed(1)}%</span>
          <span className="chapterRecordLabel">{t("read.recordAvgAccuracy")}</span>
        </div>
      </div>
    </section>
  );
}
