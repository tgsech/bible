import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSession } from "../lib/authClient";
import "./LeaderboardPage.css";

interface LeaderboardRow {
  userId: string;
  displayName: string;
  hasUsername: boolean;
  value: number;
  longestStreak?: number;
  chaptersInUnit?: number;
}

interface LeaderboardResponse {
  metric: string;
  rows: LeaderboardRow[];
}

// One entry per board. `format` turns a row's raw `value` into what shows
// in the value column — kept per-board since "12" means very different
// things on the streak board vs the WPM board.
interface BoardDef {
  id: "streak" | "chapters" | "repeats" | "bible" | "wpm" | "cpm";
  label: string;
  blurb: string;
  valueHeader: string;
  format: (row: LeaderboardRow) => string;
  empty: string;
}

const BOARDS: BoardDef[] = [
  {
    id: "streak",
    label: "Streak",
    blurb: "Consecutive days active, longest run first as a tiebreaker.",
    valueHeader: "Current streak",
    format: (r) => `${r.value} day${r.value === 1 ? "" : "s"}`,
    empty: "Nobody has an active streak yet — finish a chapter today to start one.",
  },
  {
    id: "chapters",
    label: "Chapters Completed",
    blurb: "Most distinct chapters finished at least once.",
    valueHeader: "Chapters",
    format: (r) => `${r.value} chapter${r.value === 1 ? "" : "s"}`,
    empty: "No completed chapters yet — be the first!",
  },
  {
    id: "repeats",
    label: "Most Completions",
    blurb: "Total run-throughs across every chapter, repeats included.",
    valueHeader: "Completions",
    format: (r) => `${r.value} completion${r.value === 1 ? "" : "s"}`,
    empty: "No completions yet — be the first!",
  },
  {
    id: "bible",
    label: "Full Bible Read-Throughs",
    blurb: "Users who've completed every chapter of a translation, most times.",
    valueHeader: "Read-throughs",
    format: (r) => `${r.value}×`,
    empty: "Nobody has finished a full translation yet.",
  },
  {
    id: "wpm",
    label: "Fastest (WPM)",
    blurb: "Highest average words-per-minute across completed chapters.",
    valueHeader: "Avg WPM",
    format: (r) => r.value.toFixed(1),
    empty: "No WPM completions yet.",
  },
  {
    id: "cpm",
    label: "Fastest (타/분)",
    blurb: "Highest average keystrokes-per-minute across completed chapters.",
    valueHeader: "Avg 타/분",
    format: (r) => r.value.toFixed(1),
    empty: "No 타/분 completions yet.",
  },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardPage() {
  const { data: session } = useSession();
  const [boardId, setBoardId] = useState<BoardDef["id"]>("streak");
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const board = BOARDS.find((b) => b.id === boardId)!;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<LeaderboardResponse>(`/leaderboard?by=${boardId}&limit=50`)
      .then((data) => {
        if (!cancelled) setRows(data?.rows ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  return (
    <div id="mainBody" className="leaderboardPage">
      <Link to="/" className="backHomeLink">
        ← Home
      </Link>

      <h1>Leaderboard</h1>
      <p className="leaderboardIntro">
        Ranked by public username where set, otherwise by sign-up name. Want to show up under a
        different name? Set a username from your{" "}
        <Link to="/profile">profile settings</Link>.
      </p>

      <div className="boardTabs" role="tablist">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={b.id === boardId}
            className={`boardTab${b.id === boardId ? " boardTabActive" : ""}`}
            onClick={() => setBoardId(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <p className="boardBlurb">{board.blurb}</p>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p>Couldn't load the leaderboard. {error}</p>
      ) : !rows || rows.length === 0 ? (
        <p>{board.empty}</p>
      ) : (
        <table className="leaderboardTable">
          <thead>
            <tr>
              <th className="rankCol">#</th>
              <th>Name</th>
              <th className="valueCol">{board.valueHeader}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.userId}
                className={row.userId === session?.user.id ? "leaderboardRowSelf" : undefined}
              >
                <td className="rankCol">{MEDALS[i] ?? i + 1}</td>
                <td>{row.displayName}</td>
                <td className="valueCol">{board.format(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
