import type { ReactNode } from "react";
import "./CompletionModal.css";

interface CompletionModalProps {
  speed: number;
  accuracy: number;
  speedLabel: string; // "WPM" or "타/분"
  language: string;
  onContinue: () => void;
  continueLabel: string;
  /**
   * Slot for future additions - a badge earned, a streak counter, a "share"
   * button, etc. - without needing to rebuild the modal's layout/animation
   * when those land. Unused for now, deliberately.
   */
  extras?: ReactNode;
}

export function CompletionModal({
  speed,
  accuracy,
  speedLabel,
  language,
  onContinue,
  continueLabel,
  extras,
}: CompletionModalProps) {
  const message = language === "ko" ? "수고했어요!" : "Done!";

  return (
    <div className="completionOverlay" role="dialog" aria-modal="true">
      <div className="completionCard">
        <p className="completionMessage">{message}</p>

        <div className="completionStats">
          <div className="completionStat">
            <span className="completionStatValue">{speed}</span>
            <span className="completionStatLabel">{speedLabel}</span>
          </div>
          <div className="completionStat">
            <span className="completionStatValue">{accuracy}%</span>
            <span className="completionStatLabel">Accuracy</span>
          </div>
        </div>

        {extras}

        <button type="button" className="completionContinue" onClick={onContinue}>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
