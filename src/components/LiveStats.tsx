import { memo, useEffect, useState } from "react";
import "./LiveStats.css";

interface LiveStatsProps {
  startTime: number | null;
  endTime: number | null;
  correctKeystrokes: number;
  totalKeystrokes: number;
  language: string;
}

function LiveStatsImpl({
  startTime,
  endTime,
  correctKeystrokes,
  totalKeystrokes,
  language,
}: LiveStatsProps) {
  // Ticks locally so the speed keeps climbing even between keystrokes,
  // without touching any state outside this component.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startTime === null || endTime !== null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  const elapsedMs = startTime ? (endTime ?? now) - startTime : 0;
  const minutes = elapsedMs / 1000 / 60;
  const isKorean = language === "ko";

  // English: net WPM, correct chars / 5 / minutes (5 chars = 1 "word").
  // Korean: raw keystrokes/minute (타수/분) - the conventional Korean metric,
  // counted per jamo (see koreanKeystrokes.ts) rather than divided by 5.
  const speed =
    minutes > 0 ? Math.round((isKorean ? correctKeystrokes : correctKeystrokes / 5) / minutes) : 0;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  return (
    <div className="liveStats">
      <div className="liveStatsValue">
        {speed} {isKorean ? "타/분" : "WPM"}
      </div>
      <div className="liveStatsValue">{accuracy}% acc</div>
    </div>
  );
}

export const LiveStats = memo(LiveStatsImpl);
