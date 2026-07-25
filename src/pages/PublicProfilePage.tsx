import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useLanguage } from "../i18n/LanguageContext";
import "./PublicProfilePage.css";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
}

interface PublicProfile {
  username: string;
  bio: string | null;
  mood: string | null;
  stats: {
    chaptersCompleted: number;
    avgWpm: number;
    avgCpm: number;
    avgAccuracy: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  badges: Badge[];
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);

    api
      .get<PublicProfile>(`/profile/public/${encodeURIComponent(username)}`)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div id="mainBody" className="publicProfilePage">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div id="mainBody" className="publicProfilePage">
        <Link to="/leaderboard" className="backHomeLink">
          {t("publicProfile.backLeaderboard")}
        </Link>
        <h1>{t("publicProfile.notFoundTitle")}</h1>
        <p>{t("publicProfile.notFoundBody", { username: username ?? "" })}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div id="mainBody" className="publicProfilePage">
        <p>
          {t("publicProfile.loadErrorPrefix")} {error}
        </p>
      </div>
    );
  }

  const { stats, streak, badges } = profile;

  return (
    <div id="mainBody" className="publicProfilePage">
      <h1>{profile.username}</h1>
      {profile.bio && (
        <p className="publicProfileBio">
          {t("publicProfile.aboutMe")} {profile.bio}
        </p>
      )}
      {profile.mood && (
        <p className="publicProfileMood">
          {t("publicProfile.mood")} {profile.mood}
        </p>
      )}

      <section className="profileSection">
        <h2>{t("publicProfile.stats")}</h2>
        <div className="statGrid">
          <div className="statCard">
            <span className="statValue">{stats.chaptersCompleted}</span>
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
            <span className="statValue">{stats.avgWpm ? stats.avgWpm.toFixed(1) : "—"}</span>
            <span className="statLabel">{t("profile.avgWpm")}</span>
          </div>
          <div className="statCard">
            <span className="statValue">{stats.avgCpm ? stats.avgCpm.toFixed(1) : "—"}</span>
            <span className="statLabel">{t("profile.avgCpm")}</span>
          </div>
          <div className="statCard">
            <span className="statValue">
              {stats.avgAccuracy ? `${stats.avgAccuracy.toFixed(1)}%` : "—"}
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
  );
}
