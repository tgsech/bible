import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
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
        <p>Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div id="mainBody" className="publicProfilePage">
        <Link to="/leaderboard" className="backHomeLink">
          ← Leaderboard
        </Link>
        <h1>No profile here</h1>
        <p>Nobody's claimed the username "{username}", or they haven't set one publicly.</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div id="mainBody" className="publicProfilePage">
        <p>Couldn't load this profile. {error}</p>
      </div>
    );
  }

  const { stats, streak, badges } = profile;

  return (
    <div id="mainBody" className="publicProfilePage">
      <Link to="/leaderboard" className="backHomeLink">
        ← Leaderboard
      </Link>

      <h1>{profile.username}</h1>
      {profile.mood && <p className="publicProfileMood">{profile.mood}</p>}
      {profile.bio && <p className="publicProfileBio">{profile.bio}</p>}

      <section className="profileSection">
        <h2>Stats</h2>
        <div className="statGrid">
          <div className="statCard">
            <span className="statValue">{stats.chaptersCompleted}</span>
            <span className="statLabel">Chapters finished</span>
          </div>
          <div className="statCard">
            <span className="statValue">{streak.current}</span>
            <span className="statLabel">Current streak</span>
          </div>
          <div className="statCard">
            <span className="statValue">{streak.longest}</span>
            <span className="statLabel">Longest streak</span>
          </div>
          <div className="statCard">
            <span className="statValue">{stats.avgWpm ? stats.avgWpm.toFixed(1) : "—"}</span>
            <span className="statLabel">Avg WPM</span>
          </div>
          <div className="statCard">
            <span className="statValue">{stats.avgCpm ? stats.avgCpm.toFixed(1) : "—"}</span>
            <span className="statLabel">Avg 타/분</span>
          </div>
          <div className="statCard">
            <span className="statValue">
              {stats.avgAccuracy ? `${stats.avgAccuracy.toFixed(1)}%` : "—"}
            </span>
            <span className="statLabel">Avg accuracy</span>
          </div>
        </div>
      </section>

      <section className="profileSection">
        <h2>Badges</h2>
        {badges.length === 0 ? (
          <p>No badges earned yet.</p>
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
