import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useLanguage } from "../i18n/LanguageContext";
import { FeaturedVerseCard, type FeaturedVerse } from "../components/FeaturedVerseCard";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import "./PublicProfilePage.css";

const TRANSLATIONS = [nivEn, krvKo];

function bookName(translationId: string, bookId: string): string {
  const translation = TRANSLATIONS.find((t) => t.id === translationId);
  return translation?.books.find((b) => b.id === bookId)?.name ?? bookId;
}

function translationName(translationId: string): string {
  return TRANSLATIONS.find((t) => t.id === translationId)?.name ?? translationId;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
}

interface PublicProfile {
  username: string;
  name: string;
  bio: string | null;
  mood: string | null;
  teamId: string | null;
  teamName: string | null;
  memberSince: string;
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
  featuredVerses: FeaturedVerse[];
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, lang } = useLanguage();

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
  const memberSinceLabel = new Date(profile.memberSince).toLocaleDateString(
    lang === "ko" ? "ko-KR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div id="mainBody" className="publicProfilePage">
      <div className="profileCard">
        <div className="profileCardBanner" />
        <div className="profileCardBody">
          <h1 className="profileCardUsername">{profile.username}</h1>
          <p className="profileCardSignedUpAs">{profile.name }</p>

          <div className="profileCardSection">
            <h2 className="profileCardLabel">{t("publicProfile.aboutMe")}</h2>
            <p className="profileCardText">{profile.bio || "—"}</p>
          </div>

          <div className="profileCardSection">
            <h2 className="profileCardLabel">{t("directory.teamLabel")}</h2>
            <p className="profileCardText">
              {profile.teamId && profile.teamName ? (
                <Link to={`/team/${profile.teamId}`} className="profileCardTeamLink">
                  {profile.teamName}
                </Link>
              ) : (
                t("directory.solo")
              )}
            </p>
          </div>

          {profile.mood && <p className="profileCardMood">&ldquo;{profile.mood}&rdquo;</p>}

          <p className="profileCardSince">{t("publicProfile.since", { date: memberSinceLabel })}</p>
        </div>
      </div>

      {profile.featuredVerses.length > 0 && (
        <section className="profileSection">
          <h2>{t("publicProfile.featuredVerses")}</h2>
          <ul className="featuredVerseList">
            {profile.featuredVerses.map((verse) => (
              <FeaturedVerseCard
                key={`${verse.translationId}-${verse.bookId}-${verse.chapter}-${verse.verse}`}
                verse={verse}
                translationName={translationName(verse.translationId)}
                bookName={bookName(verse.translationId, verse.bookId)}
              />
            ))}
          </ul>
        </section>
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
