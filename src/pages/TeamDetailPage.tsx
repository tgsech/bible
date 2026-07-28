import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useSession } from "../lib/authClient";
import { useLanguage } from "../i18n/LanguageContext";
import { TeamMemberCard, type TeamMember } from "../components/TeamMemberCard";
import { TeamSettingsPanel } from "../components/TeamSettingsPanel";
import "./TeamDetailPage.css";

interface PendingRequest {
  userId: string;
  displayName: string;
  requestedAt: string;
}

interface TeamDetail {
  id: string;
  name: string;
  joinPolicy: "auto" | "request";
  isOwner: boolean;
  memberCount: number;
  viewerStatus: "member" | "pending" | "none";
  members: TeamMember[];
  pendingRequests: PendingRequest[];
}

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    if (!id) return Promise.resolve();
    setError(null);
    setNotFound(false);
    return api
      .get<TeamDetail>(`/teams/${id}`)
      .then((data) => {
        if (data) setTeam(data);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(String(err));
        }
      });
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post<{ status: string }>(`/teams/${id}/join`, {});
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("teams.actionErrorPrefix"));
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post<{ status: string }>(`/teams/${id}/leave`, {});
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("teams.actionErrorPrefix"));
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!id) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post<{ status: string }>(`/teams/${id}/requests/${userId}/approve`, {});
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("teams.actionErrorPrefix"));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!id) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post<{ status: string }>(`/teams/${id}/requests/${userId}/reject`, {});
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("teams.actionErrorPrefix"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div id="mainBody" className="teamDetailPage">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div id="mainBody" className="teamDetailPage">
        <Link to="/directory" className="backTeamsLink">
          {t("teams.backTeams")}
        </Link>
        <h1>{t("teams.notFoundTitle")}</h1>
        <p>{t("teams.notFoundBody")}</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div id="mainBody" className="teamDetailPage">
        <p>
          {t("teams.loadErrorDetailPrefix")} {error}
        </p>
      </div>
    );
  }

  const memberCountLabel =
    lang === "ko" ? `${team.memberCount}명` : `${team.memberCount} member${team.memberCount === 1 ? "" : "s"}`;

  const joinButtonLabel =
    team.viewerStatus === "member"
      ? t("teams.leave")
      : team.viewerStatus === "pending"
      ? t("teams.cancelRequest")
      : team.joinPolicy === "request"
      ? t("teams.requestToJoin")
      : t("teams.join");

  return (
    <div id="mainBody" className="teamDetailPage">
      <Link to="/directory" className="backTeamsLink">
        {t("teams.backTeams")}
      </Link>

      <div className="teamDetailHeader">
        <div>
          <h1>
            {team.name}
            {team.isOwner && <span className="teamDetailOwnerBadge">{t("teams.ownerBadge")}</span>}
          </h1>
          <div className="teamDetailMeta">
            <span>{memberCountLabel}</span>
            <span className="teamDetailPolicyBadge">
              {team.joinPolicy === "request" ? t("teams.policyRequestBadge") : t("teams.policyAutoBadge")}
            </span>
          </div>
        </div>

        {session ? (
          team.viewerStatus === "member" && team.isOwner ? (
            <span className="teamDetailOwnerLeaveHint">{t("teams.ownerLeaveHint")}</span>
          ) : (
            <button type="button" className="teamDetailJoinButton" onClick={team.viewerStatus === "none" ? handleJoin : handleLeave} disabled={busy}>
              {joinButtonLabel}
            </button>
          )
        ) : (
          <span className="teamDetailSignInHint">{t("teams.signInToJoin")}</span>
        )}
      </div>

      {actionError && <p className="teamDetailActionError">{actionError}</p>}

      {team.isOwner && team.joinPolicy === "request" && (
        <section className="teamDetailSection">
          <h2>{t("teams.pendingRequestsTitle")}</h2>
          {team.pendingRequests.length === 0 ? (
            <p>{t("teams.noPendingRequests")}</p>
          ) : (
            <ul className="pendingRequestsList">
              {team.pendingRequests.map((req) => (
                <li key={req.userId} className="pendingRequestRow">
                  <span>{req.displayName}</span>
                  <div className="pendingRequestActions">
                    <button type="button" onClick={() => handleApprove(req.userId)} disabled={busy}>
                      {t("teams.approve")}
                    </button>
                    <button type="button" onClick={() => handleReject(req.userId)} disabled={busy}>
                      {t("teams.reject")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="teamDetailSection">
        <h2>{t("teams.membersTitle")}</h2>
        {team.members.length === 0 ? (
          <p>{t("teams.noMembers")}</p>
        ) : (
          <div className="teamMembersGrid">
            {team.members.map((m) => (
              <TeamMemberCard key={m.userId} member={m} />
            ))}
          </div>
        )}
      </section>

      {team.isOwner && session && (
        <TeamSettingsPanel
          teamId={team.id}
          name={team.name}
          joinPolicy={team.joinPolicy}
          members={team.members}
          currentUserId={session.user.id}
          onChanged={load}
          onDeleted={() => navigate("/directory")}
        />
      )}
    </div>
  );
}
