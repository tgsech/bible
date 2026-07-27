import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadChapter } from "../bible-data/loader";
import { useLanguage } from "../i18n/LanguageContext";
import type { SavedVerse } from "../hooks/useSavedVerses";
import "./BookmarkedVerseCard.css";

interface BookmarkedVerseCardProps {
  bookmark: SavedVerse;
  translationName: string;
  bookName: string;
  // Whether flipping this one's toggle ON is currently allowed - false
  // when it's already off and MAX_PUBLIC_SAVED_VERSES are already
  // featured elsewhere (see useSavedVerses.featuredCount). A verse that's
  // ALREADY on can always be turned back off regardless of this flag.
  canFeatureMore: boolean;
  onToggle: (bookmark: SavedVerse, next: boolean) => void;
  onRemove: (bookmark: SavedVerse) => void;
}

/**
 * One row in the profile's "Bookmarked verses" section: translation, date,
 * book/chapter/verse (linking back into reading mode), the verse text
 * itself (fetched lazily via loadChapter, same source ChapterView/ReadPage
 * use), a public-profile toggle, and a remove button. Read-only sibling of
 * this same data shows up on PublicProfilePage for whichever ones are
 * toggled on - that view has no toggle/remove since it's someone else's.
 */
export function BookmarkedVerseCard({
  bookmark,
  translationName,
  bookName,
  canFeatureMore,
  onToggle,
  onRemove,
}: BookmarkedVerseCardProps) {
  const { t, lang } = useLanguage();
  const [verseText, setVerseText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setVerseText(null);
    loadChapter(bookmark.translationId, bookmark.bookId, bookmark.chapter)
      .then((data) => {
        if (cancelled) return;
        setVerseText(data.verses[bookmark.verse - 1] ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setVerseText(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bookmark.translationId, bookmark.bookId, bookmark.chapter, bookmark.verse]);

  const dateLabel = new Date(bookmark.createdAt).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const toggleDisabled = !bookmark.showOnPublicProfile && !canFeatureMore;

  return (
    <li className="bookmarkCard">
      <div className="bookmarkCardHeader">
        <Link
          to={`/read/${bookmark.translationId}/${bookmark.bookId}/${bookmark.chapter}`}
          className="bookmarkCardRef"
        >
          {bookName} {bookmark.chapter}:{bookmark.verse}
        </Link>
        <span className="bookmarkCardMeta">
          {translationName} · {t("profile.bookmarkDate")} {dateLabel}
        </span>
      </div>

      <p className="bookmarkCardText">{verseText ?? "…"}</p>

      <div className="bookmarkCardActions">
        <label className="bookmarkCardToggle">
          <input
            type="checkbox"
            checked={bookmark.showOnPublicProfile}
            disabled={toggleDisabled}
            onChange={(e) => onToggle(bookmark, e.target.checked)}
          />
          {t("profile.featureToggleLabel")}
        </label>
        <button type="button" className="bookmarkCardRemove" onClick={() => onRemove(bookmark)}>
          {t("profile.removeBookmark")}
        </button>
      </div>
    </li>
  );
}
