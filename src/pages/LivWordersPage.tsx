import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useSession } from "../lib/authClient";
import { useLanguage } from "../i18n/LanguageContext";
import { UserDirectoryCard, type DirectoryUser } from "../components/UserDirectoryCard";
import { TeamCard, type TeamSummary } from "../components/TeamCard";
import { CreateTeamForm } from "../components/CreateTeamForm";
import "./LivWordersPage.css";

type Tab = "users" | "teams";

export function LivWordersPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div id="mainBody" className="livWordersPage">
      <h1>{t("livworders.title")}</h1>

      <div className="livWordersTabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "users"}
          className={`livWordersTab${tab === "users" ? " livWordersTabActive" : ""}`}
          onClick={() => setTab("users")}
        >
          {t("livworders.tabs.users")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "teams"}
          className={`livWordersTab${tab === "teams" ? " livWordersTabActive" : ""}`}
          onClick={() => setTab("teams")}
        >
          {t("livworders.tabs.teams")}
        </button>
      </div>

      {tab === "users" ? <UsersTab /> : <TeamsTab signedIn={!!session} />}
    </div>
  );
}

function UsersTab() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<DirectoryUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<{ users: DirectoryUser[] }>("/directory")
      .then((data) => {
        if (!cancelled) setUsers(data?.users ?? []);
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
  }, []);

  if (loading) return <p>{t("common.loading")}</p>;
  if (error) {
    return (
      <p>
        {t("directory.loadErrorPrefix")} {error}
      </p>
    );
  }
  if (!users || users.length === 0) return <p>{t("directory.empty")}</p>;

  return (
    <div className="directoryGrid">
      {users.map((u) => (
        <UserDirectoryCard key={u.username} user={u} />
      ))}
    </div>
  );
}

function TeamsTab({ signedIn }: { signedIn: boolean }) {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTeams = () => {
    setError(null);
    return api
      .get<{ teams: TeamSummary[] }>("/teams")
      .then((data) => setTeams(data?.teams ?? []))
      .catch((err) => setError(String(err)));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ teams: TeamSummary[] }>("/teams")
      .then((data) => {
        if (!cancelled) setTeams(data?.teams ?? []);
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
  }, []);

  const handleJoin = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await api.post<{ status: string }>(`/teams/${id}/join`, {});
      await loadTeams();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("teams.actionErrorPrefix"));
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await api.post<{ status: string }>(`/teams/${id}/leave`, {});
      await loadTeams();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("teams.actionErrorPrefix"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {signedIn && !showCreate && (
        <button type="button" className="createTeamOpenButton" onClick={() => setShowCreate(true)}>
          {t("teams.createButton")}
        </button>
      )}

      {signedIn && showCreate && (
        <CreateTeamForm
          onCancel={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadTeams();
          }}
        />
      )}

      {actionError && <p className="teamsActionError">{actionError}</p>}

      {loading ? (
        <p>{t("common.loading")}</p>
      ) : error ? (
        <p>
          {t("teams.loadErrorPrefix")} {error}
        </p>
      ) : !teams || teams.length === 0 ? (
        <p>{t("teams.empty")}</p>
      ) : (
        <div className="teamsGrid">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              signedIn={signedIn}
              busy={busyId === team.id}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
