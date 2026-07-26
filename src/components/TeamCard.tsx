import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./TeamCard.css";

export interface TeamSummary {
  id: string;
  name: string;
  joinPolicy: "auto" | "request";
  memberCount: number;
  isOwner: boolean;
  viewerStatus: "member" | "pending" | "none";
}

interface Props {
  team: TeamSummary;
  signedIn: boolean;
  busy: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}

// Whole card is a Link to the team detail page (TeamDetailPage) — the
// join/leave button sits inside it but stops propagation so tapping the
// button doesn't also navigate.
export function TeamCard({ team, signedIn, busy, onJoin, onLeave }: Props) {
  const { t, lang } = useLanguage();

  const memberCountLabel =
    lang === "ko"
      ? `${team.memberCount}명`
      : `${team.memberCount} member${team.memberCount === 1 ? "" : "s"}`;

  const buttonLabel =
    team.viewerStatus === "member"
      ? t("teams.leave")
      : team.viewerStatus === "pending"
      ? t("teams.cancelRequest")
      : team.joinPolicy === "request"
      ? t("teams.requestToJoin")
      : t("teams.join");

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (team.viewerStatus === "none") {
      onJoin(team.id);
    } else {
      onLeave(team.id);
    }
  };

  return (
    <Link to={`/team/${team.id}`} className="teamCard">
      <div className="teamCardInfo">
        <span className="teamCardName">
          {team.name}
          {team.isOwner && <span className="teamCardOwnerBadge">{t("teams.ownerBadge")}</span>}
        </span>
        <span className="teamCardMembers">{memberCountLabel}</span>
      </div>
      {signedIn ? (
        <button
          type="button"
          className={`teamCardButton${team.viewerStatus !== "none" ? " teamCardButtonActive" : ""}`}
          onClick={handleButtonClick}
          disabled={busy}
        >
          {buttonLabel}
        </button>
      ) : (
        <span className="teamCardSignInHint">{t("teams.signInToJoin")}</span>
      )}
    </Link>
  );
}
