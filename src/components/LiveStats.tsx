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
  // Carried over from a previous sitting on this chapter (see
  // useTypingSession's baseElapsedMs/baseCorrectKeystrokes/
  // baseTotalKeystrokes) - added on top of this sitting's own numbers so
  // the live counter keeps climbing from where a prior sitting left off
  // on resume, instead of restarting at zero. Both default to 0 so a
  // fresh chapter (nothing to carry over) behaves exactly as before.
  baseElapsedMs?: number;
  baseCorrectKeystrokes?: number;
  baseTotalKeystrokes?: number;
}

function LiveStatsImpl({
  startTime,
  endTime,
  correctKeystrokes,
  totalKeystrokes,
  lastActivityAt,
  pausedMs,
  language,
  baseElapsedMs = 0,
  baseCorrectKeystrokes = 0,
  baseTotalKeystrokes = 0,
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

  const elapsedMs = startTime ? baseElapsedMs + (endTime ?? cappedNow) - startTime - pausedMs : 0;
  const { speed, accuracy, label } = computeTypingStats(
    baseCorrectKeystrokes + correctKeystrokes,
    baseTotalKeystrokes + totalKeystrokes,
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
