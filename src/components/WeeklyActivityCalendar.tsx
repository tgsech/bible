import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useLanguage } from "../i18n/LanguageContext";
import { CalendarIcon } from "./NavIcons";
import "./WeeklyActivityCalendar.css";

interface ActivityResponse {
  range: "week" | "month";
  start: string; // YYYY-MM-DD
  end: string;
  activeDates: string[];
}

// Mirrors the backend's weekdayOf() in routes/profile.ts — both need to
// agree on which weekday a YYYY-MM-DD key falls on, resolved against
// America/New_York (see streaks.ts's STREAK_TIME_ZONE), not the visitor's
// own browser timezone. A UTC-8 visitor and a UTC+9 visitor looking at the
// same account must see the identical 7 boxes.
const WEEKDAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function todayKeyEastern(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

// Renders the 7 Sun-Sat boxes for the current week regardless of whether
// the /activity fetch has resolved yet, so there's no layout jump once
// data arrives — only which boxes are lit up changes.
function currentWeekDays(): string[] {
  const today = todayKeyEastern();
  const weekdayName = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  });
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  const start = addDays(today, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function WeeklyActivityCalendar() {
  const { lang, t } = useLanguage();
  const [activeDates, setActiveDates] = useState<Set<string> | null>(null);
  const days = currentWeekDays();
  const today = todayKeyEastern();
  const labels = lang === "ko" ? WEEKDAY_LABELS_KO : WEEKDAY_LABELS_EN;

  useEffect(() => {
    let cancelled = false;
    api
      .get<ActivityResponse>("/profile/activity?range=week")
      .then((res) => {
        if (!cancelled && res) setActiveDates(new Set(res.activeDates));
      })
      .catch((err) => console.error("Failed to load weekly activity", err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="weeklyActivity">
      <h3 className="weeklyActivityTitle">
        <CalendarIcon /> {t("home.weeklyActivity")}
      </h3>
      <div className="weeklyActivityGrid">
        {days.map((day, i) => {
          const isActive = activeDates?.has(day) ?? false;
          const isToday = day === today;
          const isFuture = day > today;
          return (
            <div key={day} className="weeklyActivityDay">
              <span className="weeklyActivityLabel">{labels[i]}</span>
              <span
                className={
                  "weeklyActivityBox" +
                  (isActive ? " weeklyActivityBox--active" : "") +
                  (isToday ? " weeklyActivityBox--today" : "") +
                  (isFuture ? " weeklyActivityBox--future" : "")
                }
                aria-label={day}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
