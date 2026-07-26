import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { useLanguage } from "../i18n/LanguageContext";
import "./CreateTeamForm.css";

interface CreatedTeam {
  id: string;
  name: string;
  joinPolicy: "auto" | "request";
  ownerId: string | null;
  createdAt: string;
}

interface Props {
  onCreated: (team: CreatedTeam) => void;
  onCancel: () => void;
}

export function CreateTeamForm({ onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [joinPolicy, setJoinPolicy] = useState<"auto" | "request">("auto");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const team = await api.post<CreatedTeam>("/teams", { name: name.trim(), joinPolicy });
      if (team) onCreated(team);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("teams.createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="createTeamForm" onSubmit={handleSubmit}>
      <h2>{t("teams.createTitle")}</h2>

      <label className="createTeamField">
        <span>{t("teams.nameLabel")}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("teams.namePlaceholder")}
          minLength={2}
          maxLength={40}
          required
        />
      </label>

      <fieldset className="createTeamPolicy">
        <legend>{t("teams.policyLabel")}</legend>
        <label>
          <input
            type="radio"
            name="joinPolicy"
            checked={joinPolicy === "auto"}
            onChange={() => setJoinPolicy("auto")}
          />
          {t("teams.policyAuto")}
        </label>
        <label>
          <input
            type="radio"
            name="joinPolicy"
            checked={joinPolicy === "request"}
            onChange={() => setJoinPolicy("request")}
          />
          {t("teams.policyRequest")}
        </label>
      </fieldset>

      {error && <p className="createTeamError">{error}</p>}

      <div className="createTeamActions">
        <button type="button" className="createTeamCancel" onClick={onCancel} disabled={saving}>
          {t("teams.cancel")}
        </button>
        <button type="submit" className="createTeamSubmit" disabled={saving || name.trim().length < 2}>
          {saving ? t("teams.creating") : t("teams.createSubmit")}
        </button>
      </div>
    </form>
  );
}
