import "./BookChapterSelector.css";
import type { BookMeta, TranslationMeta } from "../bible-data/types";

interface Props {
  translations: TranslationMeta[];
  translationId: string;
  bookId: string;
  chapter: number;
  onChange: (next: { translationId: string; bookId: string; chapter: number }) => void;
}

export function BookChapterSelector({ translations, translationId, bookId, chapter, onChange }: Props) {
  const translation = translations.find((t) => t.id === translationId) ?? translations[0];
  const book = translation.books.find((b) => b.id === bookId) ?? translation.books[0];

  // Group books by their `group` label (e.g. "Old Testament"/"New Testament")
  // so the dropdown stays navigable once all 66 books are populated - a flat
  // 66-item list is exactly the "convoluted" problem being solved here.
  const groups = new Map<string, BookMeta[]>();
  for (const b of translation.books) {
    const list = groups.get(b.group) ?? [];
    list.push(b);
    groups.set(b.group, list);
  }

  return (
    <div className="bookChapterSelector">
      <label className="selectField">
        <span className="selectLabel">Translation</span>
        <select
          value={translation.id}
          onChange={(e) => {
            const nextTranslation = translations.find((t) => t.id === e.target.value)!;
            onChange({
              translationId: nextTranslation.id,
              bookId: nextTranslation.books[0].id,
              chapter: 1,
            });
          }}
        >
          {translations.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label className="selectField">
        <span className="selectLabel">Book</span>
        <select
          value={book.id}
          onChange={(e) =>
            onChange({ translationId: translation.id, bookId: e.target.value, chapter: 1 })
          }
        >
          {[...groups.entries()].map(([groupName, books]) => (
            <optgroup key={groupName} label={groupName}>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="selectField selectField--narrow">
        <span className="selectLabel">Chapter</span>
        <select
          value={chapter}
          onChange={(e) =>
            onChange({ translationId: translation.id, bookId: book.id, chapter: Number(e.target.value) })
          }
        >
          {book.versesPerChapter.map((_, i) => (
            <option key={i} value={i + 1}>
              {translation.language === "ko" ? `${i + 1}장` : i + 1}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
