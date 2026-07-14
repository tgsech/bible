import { memo, useEffect, useState } from "react";
import { computeTypingStats } from "../typing/stats";
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
      <div className="liveStatsValue">{accuracy}% acc</div>
    </div>
  );
}

export const LiveStats = memo(LiveStatsImpl);
