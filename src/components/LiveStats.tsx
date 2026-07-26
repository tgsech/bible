import { memo, useEffect, useState } from "react";
import { computeTypingStats } from "../typing/stats";
import { useLanguage } from "../i18n/LanguageContext";
import { PAUSE_THRESHOLD_MS } from "../hooks/useTypingSession";
import "./LiveStats.css";

interface LiveStatsProps {
  startTime: number | null;
  endTime: number | null;
  correctKeystrokes: number;
  totalKeystrokes: number;
  lastActivityAt: number | null;
  pausedMs: number;
  language: string;
}

function LiveStatsImpl({
  startTime,
  endTime,
  correctKeystrokes,
  totalKeystrokes,
  lastActivityAt,
  pausedMs,
  language,
}: LiveStatsProps) {
  // Ticks locally so the speed keeps climbing even between keystrokes,
  // without touching any state outside this component.
  const [now, setNow] = useState(() => Date.now());
  const { t } = useLanguage();

  useEffect(() => {
    if (startTime === null || endTime !== null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  // `pausedMs` (from useTypingSession) only accounts for gaps between
  // keystrokes that have already happened - it can't know about a pause
  // that's still ongoing right now, since there's no "next keystroke" yet
  // to close it out. So on top of that, once the *current* idle stretch
  // itself crosses the grace period, freeze the live display at that
  // boundary rather than letting it keep counting the ongoing pause
  // against you in real time. Typing again immediately continues from
  // wherever it froze, since the very next keystroke folds this same idle
  // stretch into pausedMs itself (see useTypingSession) - no jump.
  const activityBaseline = lastActivityAt ?? startTime;
  const cappedNow = activityBaseline !== null ? Math.min(now, activityBaseline + PAUSE_THRESHOLD_MS) : now;

  const elapsedMs = startTime ? (endTime ?? cappedNow) - startTime - pausedMs : 0;
  const { speed, accuracy, label } = computeTypingStats(
    correctKeystrokes,
    totalKeystrokes,
    elapsedMs,
    language
  );

  return (
    <div className="liveStats">
      <div className="liveStatsValue">
        {speed} {label}
      </div>
      <div className="liveStatsValue">
        {accuracy}% {t("livestats.acc")}
      </div>
    </div>
  );
}

export const LiveStats = memo(LiveStatsImpl);
