import type { TranslationMeta } from "../bible-data/types";

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

  return (
    <div id="bookSelectCont">
      <select
        className="bookSelect"
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

      <select
        className="bookSelect"
        value={book.id}
        onChange={(e) => onChange({ translationId: translation.id, bookId: e.target.value, chapter: 1 })}
      >
        {translation.books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        className="bookSelect"
        value={chapter}
        onChange={(e) =>
          onChange({ translationId: translation.id, bookId: book.id, chapter: Number(e.target.value) })
        }
      >
        {book.versesPerChapter.map((_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}장
          </option>
        ))}
      </select>
    </div>
  );
}
