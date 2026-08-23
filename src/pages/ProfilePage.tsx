import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authClient, useSession } from "../lib/authClient";
import { api, ApiError } from "../lib/api";
import { ProfileSettingsForm } from "../components/ProfileSettingsForm";
import { BookmarkedVerseCard } from "../components/BookmarkedVerseCard";
import { ProgressGrid } from "../components/ProgressGrid";
import { Tabs, type TabDef } from "../components/Tabs";
import { AccountTab } from "../components/AccountTab";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import { useLanguage } from "../i18n/LanguageContext";
import { MAX_PUBLIC_SAVED_VERSES, type SavedVerse } from "../hooks/useSavedVerses";
import "./ProfilePage.css";

const TRANSLATIONS = [nivEn, krvKo];

function bookName(translationId: string, bookId: string): string {
  const translation = TRANSLATIONS.find((t) => t.id === translationId);
  return translation?.books.find((b) => b.id === bookId)?.name ?? bookId;
}

function translationName(translationId: string): string {
  return TRANSLATIONS.find((t) => t.id === translationId)?.name ?? translationId;
}

interface ProgressRow {
  translationId: string;
  bookId: string;
  chapter: number;
  verseIndex: number;
  updatedAt: string;
}

interface CompletionRow {
  translationId: string;
  bookId: string;
  chapter: number;
  unit: "wpm" | "cpm";
  timesCompleted: number;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
  lastCompletedAt: string;
}

interface ReadingPositionRow {
  translationId: string;
  bookId: string;
  chapter: number;
  updatedAt: string;
}

interface ProfileSettings {
  userId: string;
  username: string | null;
  bio: string | null;
  mood: string | null;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
}

interface ProfileSummary {
  latestPosition: ProgressRow | null;
  latestReadingPosition: ReadingPositionRow | null;
  overall: {
    totalCompletions: number;
    chaptersCompleted: number;
    avgWpm: number;
    avgCpm: number;
    avgAccuracy: number;
  };
  completions: CompletionRow[];
  bookmarks: SavedVerse[];
  inProgress: ProgressRow[];
  streak: {
    current: number;
    longest: number;
  };
  badges: Badge[];
  settings: ProfileSettings;
}

const TAB_IDS = ["overview", "progress", "public", "verses", "account"] as const;
type TabId = (typeof TAB_IDS)[number];

function isTabId(value: string | null): value is TabId {
  return TAB_IDS.includes(value as TabId);
}

export function ProfilePage() {
  const { data: session, isPending: sessionPending } = useSession();
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();

  const activeTab: TabId = isTabId(searchParams.get("tab")) ? (searchParams.get("tab") as TabId) : "overview";

  const setActiveTab = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", id);
      return next;
    });
  };

  const tabs: TabDef[] = [
    { id: "overview", label: t("profile.tabOverview") },
    { id: "progress", label: t("profile.tabProgress") },
    { id: "public", label: t("profile.tabPublic") },
    { id: "verses", label: t("profile.tabVerses") },
    { id: "account", label: t("profile.tabAccount") },
  ];

  const handleToggleFeatured = async (bookmark: SavedVerse, next: boolean) => {
    setBookmarkError(null);
    try {
      const updated = await api.patch<SavedVerse>(`/saved-verses/${bookmark.id}/public`, {
        showOnPublicProfile: next,
      });
      if (!updated) return;
      setSummary((prev) =>
        prev
          ? { ...prev, bookmarks: prev.bookmarks.map((b) => (b.id === updated.id ? updated : b)) }
          : prev
      );
    } catch (err) {
      // A 409 here means someone already has MAX_PUBLIC_SAVED_VERSES
      // featured elsewhere (e.g. a second tab) - the per-card `disabled`
      // check below is only a best-effort mirror of that same cap.
      setBookmarkError(err instanceof ApiError ? err.message : String(err));
    }
  };

  const handleRemoveBookmark = async (bookmark: SavedVerse) => {
    setBookmarkError(null);
    try {
      await api.delete(`/saved-verses/${bookmark.id}`);
      setSummary((prev) =>
        prev ? { ...prev, bookmarks: prev.bookmarks.filter((b) => b.id !== bookmark.id) } : prev
      );
    } catch (err) {
      setBookmarkError(err instanceof ApiError ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<ProfileSummary>("/profile/summary")
      .then((data) => setSummary(data))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [session]);

  if (sessionPending || loading) {
    return (
      <div id="mainBody" className="profilePage">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div id="mainBody" className="profilePage">
        <h1>{t("profile.title")}</h1>
        <p>{t("profile.signInPrompt")}</p>
        <Link to="/auth" className="profileSignInLink">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div id="mainBody" className="profilePage">
        <h1>{t("profile.title")}</h1>
        <p>
          {t("profile.loadErrorPrefix")} {error}
        </p>
        <Link to="/">{t("common.backHome")}</Link>
      </div>
    );
  }

  const {
    latestPosition,
    latestReadingPosition,
    overall,
    completions,
    bookmarks,
    inProgress,
    streak,
    badges,
    settings,
  } = summary;
  const featuredCount = bookmarks.filter((b) => b.showOnPublicProfile).length;

  return (
    <div id="mainBody" className="profilePage">
      <div className="profileHeaderRow">
        <h1>{t("profile.possessiveTitle", { name: settings.username ?? session.user.name })}</h1>
        <button type="button" className="profileSignOut" onClick={() => authClient.signOut()}>
          {t("sidebar.signOut")}
        </button>
      </div>

      <div className="profileCurrentRow">
        <section className="profileCurrentCard">
          <h2>{t("profile.currentlyTyping")}</h2>
          {latestPosition ? (
            <p>
              <Link
                to={`/read/${latestPosition.translationId}/${latestPosition.bookId}/${latestPosition.chapter}`}
              >
                {bookName(latestPosition.translationId, latestPosition.bookId)} {latestPosition.chapter}
              </Link>
              {" — "}
              {t("profile.verse")} {latestPosition.verseIndex + 1}
            </p>
          ) : (
            <p>{t("profile.noSavedPosition")}</p>
          )}
        </section>

        <section className="profileCurrentCard">
          <h2>{t("profile.currentlyReading")}</h2>
          {latestReadingPosition ? (
            <p>
              <Link
                to={`/read/${latestReadingPosition.translationId}/${latestReadingPosition.bookId}/${latestReadingPosition.chapter}`}
              >
                {bookName(latestReadingPosition.translationId, latestReadingPosition.bookId)}{" "}
                {latestReadingPosition.chapter}
              </Link>
            </p>
          ) : (
            <p>{t("profile.noSavedReadingPosition")}</p>
          )}
        </section>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="profileTabPanel">
          <section className="profileSection">
            <h2>{t("profile.overallStats")}</h2>
            <div className="statGrid">
              <div className="statCard">
                <span className="statValue">{overall.totalCompletions}</span>
                <span className="statLabel">{t("profile.totalCompletions")}</span>
              </div>
              <div className="statCard">
                <span className="statValue">{overall.chaptersCompleted}</span>
                <span className="statLabel">{t("profile.chaptersFinished")}</span>
              </div>
              <div className="statCard">
                <span className="statValue">{streak.current}</span>
                <span className="statLabel">{t("publicProfile.currentStreak")}</span>
              </div>
              <div className="statCard">
                <span className="statValue">{streak.longest}</span>
                <span className="statLabel">{t("publicProfile.longestStreak")}</span>
              </div>
              <div className="statCard">
                <span className="statValue">{overall.avgWpm ? overall.avgWpm.toFixed(1) : "—"}</span>
                <span className="statLabel">{t("profile.avgWpm")}</span>
              </div>
              <div className="statCard">
                <span className="statValue">{overall.avgCpm ? overall.avgCpm.toFixed(1) : "—"}</span>
                <span className="statLabel">{t("profile.avgCpm")}</span>
              </div>
              <div className="statCard">
                <span className="statValue">
                  {overall.avgAccuracy ? `${overall.avgAccuracy.toFixed(1)}%` : "—"}
                </span>
                <span className="statLabel">{t("profile.avgAccuracy")}</span>
              </div>
            </div>
          </section>

          <section className="profileSection">
            <h2>{t("publicProfile.badges")}</h2>
            {badges.length === 0 ? (
              <p>{t("publicProfile.noBadges")}</p>
            ) : (
              <ul className="badgeList">
                {badges.map((badge) => (
                  <li key={badge.id} className="badgeCard" title={badge.description}>
                    {badge.icon && <span className="badgeIcon">{badge.icon}</span>}
                    <span className="badgeName">{badge.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {activeTab === "progress" && (
        <div className="profileTabPanel">
          <ProgressGrid translations={TRANSLATIONS} completions={completions} inProgress={inProgress} />
        </div>
      )}

      {activeTab === "public" && (
        <div className="profileTabPanel">
          <section className="profileSection">
            <p className="settingsHint">
              {t("profile.settingsHint")}
              {settings.username && (
                <>
                  {" "}
                  <Link to={`/u/${encodeURIComponent(settings.username)}`}>{t("profile.viewPublic")}</Link>
                </>
              )}
            </p>
            <ProfileSettingsForm
              settings={settings}
              onSaved={(updated) => setSummary((prev) => (prev ? { ...prev, settings: updated } : prev))}
            />
          </section>
        </div>
      )}

      {activeTab === "verses" && (
        <div className="profileTabPanel">
          <section className="profileSection">
            <div className="profileHeaderRow">
              <h2>{t("profile.bookmarkedVerses")}</h2>
              {bookmarks.length > 0 && (
                <span className="settingsHint" style={{ margin: 0 }}>
                  {t("profile.featuredCount", { count: featuredCount, max: MAX_PUBLIC_SAVED_VERSES })}
                </span>
              )}
            </div>
            {bookmarkError && <p className="settingsError">{t("profile.bookmarkUpdateError")}</p>}
            {featuredCount >= MAX_PUBLIC_SAVED_VERSES && (
              <p className="settingsHint">
                {t("profile.featuredLimitReached", { max: MAX_PUBLIC_SAVED_VERSES })}
              </p>
            )}
            {bookmarks.length === 0 ? (
              <p>{t("profile.noBookmarks")}</p>
            ) : (
              <ul className="bookmarkList">
                {bookmarks.map((bookmark) => (
                  <BookmarkedVerseCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    translationName={translationName(bookmark.translationId)}
                    bookName={bookName(bookmark.translationId, bookmark.bookId)}
                    canFeatureMore={featuredCount < MAX_PUBLIC_SAVED_VERSES}
                    onToggle={handleToggleFeatured}
                    onRemove={handleRemoveBookmark}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {activeTab === "account" && (
        <div className="profileTabPanel">
          <AccountTab />
        </div>
      )}
    </div>
  );
}
