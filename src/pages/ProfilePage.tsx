import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authClient, useSession } from "../lib/authClient";
import { api } from "../lib/api";
import { ProfileSettingsForm } from "../components/ProfileSettingsForm";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
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
        <p>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div id="mainBody" className="profilePage">
        <h1>Profile</h1>
        <p>Sign in to see your saved progress, stats, and completions here.</p>
        <Link to="/auth" className="profileSignInLink">
          Sign in
        </Link>
        {" · "}
        <Link to="/">← Back home</Link>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div id="mainBody" className="profilePage">
        <h1>Profile</h1>
        <p>Couldn't load your profile. {error}</p>
        <Link to="/">← Back home</Link>
      </div>
    );
  }

  const { latestPosition, latestReadingPosition, overall, completions, settings } = summary;

  return (
    <div id="mainBody" className="profilePage">
      <Link to="/" className="backHomeLink">
        ← Home
      </Link>

      <div className="profileHeaderRow">
        <h1>{settings.username ?? session.user.name}'s Profile</h1>
        <button type="button" className="profileSignOut" onClick={() => authClient.signOut()}>
          Sign out
        </button>
      </div>

      <section className="profileSection">
        <h2>Currently typing</h2>
        {latestPosition ? (
          <p>
            <Link
              to={`/read/${latestPosition.translationId}/${latestPosition.bookId}/${latestPosition.chapter}`}
            >
              {bookName(latestPosition.translationId, latestPosition.bookId)} {latestPosition.chapter}
            </Link>
            {" — "}
            verse {latestPosition.verseIndex + 1}
          </p>
        ) : (
          <p>No saved position yet — start typing a chapter to see it here.</p>
        )}
      </section>

      <section className="profileSection">
        <h2>Currently reading</h2>
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
          <p>No saved reading position yet — switch to read-only mode on a chapter to see it here.</p>
        )}
      </section>

      <section className="profileSection">
        <h2>Overall stats</h2>
        <div className="statGrid">
          <div className="statCard">
            <span className="statValue">{overall.totalCompletions}</span>
            <span className="statLabel">Total completions</span>
          </div>
          <div className="statCard">
            <span className="statValue">{overall.chaptersCompleted}</span>
            <span className="statLabel">Chapters finished</span>
          </div>
          <div className="statCard">
            <span className="statValue">{overall.avgWpm ? overall.avgWpm.toFixed(1) : "—"}</span>
            <span className="statLabel">Avg WPM</span>
          </div>
          <div className="statCard">
            <span className="statValue">{overall.avgCpm ? overall.avgCpm.toFixed(1) : "—"}</span>
            <span className="statLabel">Avg 타/분</span>
          </div>
          <div className="statCard">
            <span className="statValue">
              {overall.avgAccuracy ? `${overall.avgAccuracy.toFixed(1)}%` : "—"}
            </span>
            <span className="statLabel">Avg accuracy</span>
          </div>
        </div>
      </section>

      <section className="profileSection">
        <h2>Completed chapters</h2>
        {completions.length === 0 ? (
          <p>Finish a chapter and it'll show up here.</p>
        ) : (
          <table className="completionsTable">
            <thead>
              <tr>
                <th>Chapter</th>
                <th>Times completed</th>
                <th>Best speed</th>
                <th>Avg accuracy</th>
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
        <h2>Profile settings</h2>
        <p className="settingsHint">
          Your username shows on the leaderboard and directory instead of your account name — leave it
          blank to just show as anonymous there.
        </p>
        <ProfileSettingsForm
          settings={settings}
          onSaved={(updated) => setSummary((prev) => (prev ? { ...prev, settings: updated } : prev))}
        />
      </section>
    </div>
  );
}
