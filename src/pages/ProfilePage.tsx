import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authClient, useSession } from "../lib/authClient";
import { api } from "../lib/api";
import { ProfileSettingsForm } from "../components/ProfileSettingsForm";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import { useLanguage } from "../i18n/LanguageContext";
import "./ProfilePage.css";

const TRANSLATIONS = [nivEn, krvKo];

function bookName(translationId: string, bookId: string): string {
  const translation = TRANSLATIONS.find((t) => t.id === translationId);
  return translation?.books.find((b) => b.id === bookId)?.name ?? bookId;
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
  settings: ProfileSettings;
}

export function ProfilePage() {
  const { data: session, isPending: sessionPending } = useSession();
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

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

  const { latestPosition, latestReadingPosition, overall, completions, settings } = summary;

  return (
    <div id="mainBody" className="profilePage">
      <div className="profileHeaderRow">
        <h1>{t("profile.possessiveTitle", { name: settings.username ?? session.user.name })}</h1>
        <button type="button" className="profileSignOut" onClick={() => authClient.signOut()}>
          {t("sidebar.signOut")}
        </button>
      </div>

      <section className="profileSection">
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

      <section className="profileSection">
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
        <h2>{t("profile.completedChapters")}</h2>
        {completions.length === 0 ? (
          <p>{t("profile.noCompletions")}</p>
        ) : (
          <table className="completionsTable">
            <thead>
              <tr>
                <th>{t("profile.chapterCol")}</th>
                <th>{t("profile.timesCompletedCol")}</th>
                <th>{t("profile.bestSpeedCol")}</th>
                <th>{t("profile.avgAccuracyCol")}</th>
              </tr>
            </thead>
            <tbody>
              {completions.map((row) => (
                <tr key={`${row.translationId}-${row.bookId}-${row.chapter}`}>
                  <td>
                    <Link to={`/read/${row.translationId}/${row.bookId}/${row.chapter}`}>
                      {bookName(row.translationId, row.bookId)} {row.chapter}
                    </Link>
                  </td>
                  <td>{row.timesCompleted}</td>
                  <td>
                    {row.bestWpm.toFixed(1)} {row.unit === "cpm" ? "타/분" : "WPM"}
                  </td>
                  <td>{row.avgAccuracy.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="profileSection">
        <h2>{t("profile.profileSettings")}</h2>
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
  );
}
