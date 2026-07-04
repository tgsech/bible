import { memo, useEffect, useState } from "react";
import "./LiveStats.css";

interface LiveStatsProps {
  startTime: number | null;
  endTime: number | null;
  correctKeystrokes: number;
  totalKeystrokes: number;
}

function LiveStatsImpl({ startTime, endTime, correctKeystrokes, totalKeystrokes }: LiveStatsProps) {
  // Ticks locally so WPM keeps climbing even between keystrokes, without
  // touching any state outside this component.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startTime === null || endTime !== null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  const elapsedMs = startTime ? (endTime ?? now) - startTime : 0;
  const minutes = elapsedMs / 1000 / 60;

  // Net WPM: correct characters / 5 / minutes, the standard English convention.
  // NOTE: this is not yet the right formula for Korean, which is conventionally
  // measured in keystrokes/자소 rather than 5-character "words" - that's part
  // of the Korean engine work, not this pass.
  const wpm = minutes > 0 ? Math.round(correctKeystrokes / 5 / minutes) : 0;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  return (
    <div className="liveStats">
      <div className="liveStatsValue">{wpm} WPM</div>
      <div className="liveStatsValue">{accuracy}% acc</div>
    </div>
  );
}

export const LiveStats = memo(LiveStatsImpl);
