import { useEffect, useState } from "react";
import { loadChapter } from "../bible-data/loader";

export interface FeaturedVerse {
  translationId: string;
  bookId: string;
  chapter: number;
  verse: number;
  createdAt: string;
}

interface FeaturedVerseCardProps {
  verse: FeaturedVerse;
  translationName: string;
  bookName: string;
}

/**
 * Read-only sibling of BookmarkedVerseCard (see ProfilePage) - shown on
 * someone else's public profile for whichever bookmarks they've toggled
 * `showOnPublicProfile` on. No toggle/remove controls since this isn't the
 * viewer's own data; verse text is fetched the same way (loadChapter).
 */
export function FeaturedVerseCard({ verse, translationName, bookName }: FeaturedVerseCardProps) {
  const [verseText, setVerseText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setVerseText(null);
    loadChapter(verse.translationId, verse.bookId, verse.chapter)
      .then((data) => {
        if (cancelled) return;
        setVerseText(data.verses[verse.verse - 1] ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setVerseText(null);
      });
    return () => {
      cancelled = true;
    };
  }, [verse.translationId, verse.bookId, verse.chapter, verse.verse]);

  return (
    <li className="featuredVerseCard">
      <div className="featuredVerseHeader">
        <span className="featuredVerseRef">
          {bookName} {verse.chapter}:{verse.verse}
        </span>
        <span className="featuredVerseMeta">{translationName}</span>
      </div>
      <p className="featuredVerseText">{verseText ?? "…"}</p>
    </li>
  );
}
