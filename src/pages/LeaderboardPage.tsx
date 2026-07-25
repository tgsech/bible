import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSession } from "../lib/authClient";
import { useLanguage } from "../i18n/LanguageContext";
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
// things on the streak board vs the WPM board. Copy lives in the
// translation dictionary under `leaderboard.board.<id>.*` so it can switch
// with the site language.
interface BoardDef {
  id: "streak" | "chapters" | "repeats" | "bible" | "wpm" | "cpm";
  format: (row: LeaderboardRow) => string;
}

const BOARDS: BoardDef[] = [
  { id: "streak", format: (r) => `${r.value} day${r.value === 1 ? "" : "s"}` },
  { id: "chapters", format: (r) => `${r.value} chapter${r.value === 1 ? "" : "s"}` },
  { id: "repeats", format: (r) => `${r.value} completion${r.value === 1 ? "" : "s"}` },
  { id: "bible", format: (r) => `${r.value}×` },
  { id: "wpm", format: (r) => r.value.toFixed(1) },
  { id: "cpm", format: (r) => r.value.toFixed(1) },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
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
      <h1>{t("leaderboard.title")}</h1>
      <p className="leaderboardIntro">
        {t("leaderboard.introPre")}{" "}
        <Link to="/profile">{t("leaderboard.introLink")}</Link>.
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
            {t(`leaderboard.board.${b.id}.label`)}
          </button>
        ))}
      </div>

      <p className="boardBlurb">{t(`leaderboard.board.${board.id}.blurb`)}</p>

      {loading ? (
        <p>{t("common.loading")}</p>
      ) : error ? (
        <p>
          {t("leaderboard.loadErrorPrefix")} {error}
        </p>
      ) : !rows || rows.length === 0 ? (
        <p>{t(`leaderboard.board.${board.id}.empty`)}</p>
      ) : (
        <table className="leaderboardTable">
          <thead>
            <tr>
              <th className="rankCol">#</th>
              <th>{t("leaderboard.nameCol")}</th>
              <th className="valueCol">{t(`leaderboard.board.${board.id}.valueHeader`)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.userId}
                className={row.userId === session?.user.id ? "leaderboardRowSelf" : undefined}
              >
                <td className="rankCol">{MEDALS[i] ?? i + 1}</td>
                <td>
                  {row.hasUsername ? (
                    <Link to={`/u/${encodeURIComponent(row.displayName)}`}>{row.displayName}</Link>
                  ) : (
                    row.displayName
                  )}
                </td>
                <td className="valueCol">{board.format(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
