import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import type { BookMeta, TranslationMeta } from "../bible-data/types";
import "./ProgressGrid.css";

interface CompletionRow {
  translationId: string;
  bookId: string;
  chapter: number;
}

interface ProgressRow {
  translationId: string;
  bookId: string;
  chapter: number;
  verseIndex: number;
}

interface Props {
  translations: TranslationMeta[];
  completions: CompletionRow[];
  inProgress: ProgressRow[];
}

/**
 * Groups a translation's books by testament/group, and renders each book as
 * a collapsible section containing a grid of rounded squares — one per
 * chapter. Mirrors the reference history page's partial-fill squares: a
 * chapter's square fills left-to-right by verseIndex/totalVerses (how far
 * into typing that chapter someone's gotten), not just a binary
 * done/not-done. A chapter that's been fully completed at least once (per
 * chapterCompletions) always shows 100% filled with a checkmark, even if
 * its most recent in-progress verseIndex looks lower (e.g. after a
 * deliberate "retype this chapter" reset back to verse 1).
 */
export function ProgressGrid({ translations, completions, inProgress }: Props) {
  const { t } = useLanguage();
  const [translationId, setTranslationId] = useState(translations[0]?.id ?? "");
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  const translation = translations.find((tr) => tr.id === translationId) ?? translations[0];

  const completedByBook = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const row of completions) {
      if (row.translationId !== translation.id) continue;
      const set = map.get(row.bookId) ?? new Set<number>();
      set.add(row.chapter);
      map.set(row.bookId, set);
    }
    return map;
  }, [completions, translation.id]);

  // chapter -> furthest verseIndex reached, keyed by book. verseIndex is
  // 0-indexed ("currently typing verse N" = verseIndex N-1), so it already
  // equals "verses typed so far" directly.
  const verseIndexByBook = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    for (const row of inProgress) {
      if (row.translationId !== translation.id) continue;
      const chapters = map.get(row.bookId) ?? new Map<number, number>();
      chapters.set(row.chapter, row.verseIndex);
      map.set(row.bookId, chapters);
    }
    return map;
  }, [inProgress, translation.id]);

  const groups = useMemo(() => {
    const map = new Map<string, BookMeta[]>();
    for (const book of translation.books) {
      const list = map.get(book.group) ?? [];
      list.push(book);
      map.set(book.group, list);
    }
    return [...map.entries()];
  }, [translation.books]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="progressGrid">
      <div className="progressGridHeader">
        <label className="progressGridTranslationLabel">
          <span>{t("progress.translation")}</span>
          <select value={translation.id} onChange={(e) => setTranslationId(e.target.value)}>
            {translations.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {groups.map(([groupName, books]) => {
        const groupChapterCount = books.reduce((sum, b) => sum + b.versesPerChapter.length, 0);
        const groupCompletedCount = books.reduce(
          (sum, b) => sum + (completedByBook.get(b.id)?.size ?? 0),
          0
        );
        const isOpen = openGroups.has(groupName);

        return (
          <details
            key={groupName}
            className="progressGroup"
            open={isOpen}
            onToggle={(e) => {
              const nowOpen = (e.target as HTMLDetailsElement).open;
              setOpenGroups((prev) => {
                const next = new Set(prev);
                if (nowOpen) next.add(groupName);
                else next.delete(groupName);
                return next;
              });
            }}
          >
            <summary
              className="progressGroupSummary"
              onClick={(e) => {
                e.preventDefault();
                toggleGroup(groupName);
              }}
            >
              <span className="progressGroupTitle">{groupName}</span>
              <span className="progressGroupCount">
                {groupCompletedCount} / {groupChapterCount}
              </span>
            </summary>

            <div className="progressGroupBody">
              {books.map((book) => {
                const completedChapters = completedByBook.get(book.id) ?? new Set<number>();
                const chapterVerseIndexes = verseIndexByBook.get(book.id) ?? new Map<number, number>();
                const chapterCount = book.versesPerChapter.length;

                return (
                  <div key={book.id} className="progressBook">
                    <div className="progressBookHeader">
                      <span className="progressBookName">{book.name}</span>
                      <span className="progressBookCount">
                        {completedChapters.size} / {chapterCount}
                      </span>
                    </div>
                    <div className="progressChapterGrid">
                      {Array.from({ length: chapterCount }, (_, i) => i + 1).map((chapter) => {
                        const done = completedChapters.has(chapter);
                        const totalVerses = book.versesPerChapter[chapter - 1] ?? 0;
                        const versesTyped = chapterVerseIndexes.get(chapter) ?? 0;
                        const percent = done
                          ? 100
                          : totalVerses > 0
                            ? Math.max(0, Math.min(100, (versesTyped / totalVerses) * 100))
                            : 0;

                        return (
                          <Link
                            key={chapter}
                            to={`/read/${translation.id}/${book.id}/${chapter}`}
                            className={`progressChapterCell${done ? " progressChapterCell--done" : ""}`}
                            title={`${book.name} ${chapter} — ${Math.round(percent)}%`}
                          >
                            <span
                              className="progressChapterFill"
                              style={{ width: `${percent}%` }}
                              aria-hidden="true"
                            />
                            {done && (
                              <svg
                                viewBox="0 0 16 16"
                                className="progressChapterCheck"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
