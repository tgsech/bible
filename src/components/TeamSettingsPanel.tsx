import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { useLanguage } from "../i18n/LanguageContext";
import type { TeamMember } from "./TeamMemberCard";
import "./TeamSettingsPanel.css";

interface Props {
  teamId: string;
  name: string;
  joinPolicy: "auto" | "request";
  members: TeamMember[];
  currentUserId: string;
  // Renaming/policy changes just need the page to re-fetch; transferring
  // ownership does too, since the viewer's own isOwner flag flips as a
  // result - same load() the rest of the page already uses.
  onChanged: () => void;
  onDeleted: () => void;
}

export function TeamSettingsPanel({ teamId, name, joinPolicy, members, currentUserId, onChanged, onDeleted }: Props) {
  const { t } = useLanguage();

  const [nameDraft, setNameDraft] = useState(name);
  const [policyDraft, setPolicyDraft] = useState(joinPolicy);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const otherMembers = members.filter((m) => m.userId !== currentUserId);
  const [transferTarget, setTransferTarget] = useState(otherMembers[0]?.userId ?? "");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const detailsDirty = nameDraft.trim() !== name || policyDraft !== joinPolicy;

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsDirty) return;
    setSavingDetails(true);
    setDetailsError(null);
    try {
      const patch: { name?: string; joinPolicy?: "auto" | "request" } = {};
      if (nameDraft.trim() !== name) patch.name = nameDraft.trim();
      if (policyDraft !== joinPolicy) patch.joinPolicy = policyDraft;
      await api.patch(`/teams/${teamId}`, patch);
      onChanged();
    } catch (err) {
      setDetailsError(err instanceof ApiError ? err.message : t("teams.settingsSaveError"));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    setTransferring(true);
    setTransferError(null);
    try {
      await api.post(`/teams/${teamId}/transfer-owner`, { newOwnerId: transferTarget });
      setConfirmingTransfer(false);
      onChanged();
    } catch (err) {
      setTransferError(err instanceof ApiError ? err.message : t("teams.transferError"));
    } finally {
      setTransferring(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/teams/${teamId}`);
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : t("teams.deleteError"));
      setDeleting(false);
    }
  };

  return (
    <section className="teamDetailSection teamSettingsPanel">
      <h2>{t("teams.settingsTitle")}</h2>

      <form className="teamSettingsForm" onSubmit={handleSaveDetails}>
        <label className="teamSettingsField">
          <span>{t("teams.nameLabel")}</span>
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            minLength={2}
            maxLength={40}
            required
          />
        </label>

        <fieldset className="teamSettingsPolicy">
          <legend>{t("teams.policyLabel")}</legend>
          <label>
            <input
              type="radio"
              name="teamSettingsPolicy"
              checked={policyDraft === "auto"}
              onChange={() => setPolicyDraft("auto")}
            />
            {t("teams.policyAuto")}
          </label>
          <label>
            <input
              type="radio"
              name="teamSettingsPolicy"
              checked={policyDraft === "request"}
              onChange={() => setPolicyDraft("request")}
            />
            {t("teams.policyRequest")}
          </label>
        </fieldset>

        {detailsError && <p className="teamSettingsError">{detailsError}</p>}

        <button type="submit" className="teamSettingsSaveButton" disabled={!detailsDirty || savingDetails || nameDraft.trim().length < 2}>
          {savingDetails ? t("teams.saving") : t("teams.saveChanges")}
        </button>
      </form>

      <div className="teamSettingsDivider" />

      <div className="teamSettingsDangerRow">
        <div>
          <h3>{t("teams.transferTitle")}</h3>
          <p className="teamSettingsHint">
            {otherMembers.length === 0 ? t("teams.transferNoMembersHint") : t("teams.transferHint")}
          </p>
        </div>
        {otherMembers.length > 0 && (
          <div className="teamSettingsDangerAction">
            <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} disabled={transferring}>
              {otherMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
            {confirmingTransfer ? (
              <>
                <button type="button" className="teamSettingsConfirmButton" onClick={handleTransfer} disabled={transferring}>
                  {transferring ? t("teams.transferring") : t("teams.transferConfirm")}
                </button>
                <button
                  type="button"
                  className="teamSettingsCancelButton"
                  onClick={() => setConfirmingTransfer(false)}
                  disabled={transferring}
                >
                  {t("teams.cancel")}
                </button>
              </>
            ) : (
              <button type="button" className="teamSettingsButton" onClick={() => setConfirmingTransfer(true)}>
                {t("teams.transferButton")}
              </button>
            )}
          </div>
        )}
      </div>
      {transferError && <p className="teamSettingsError">{transferError}</p>}

      <div className="teamSettingsDangerRow">
        <div>
          <h3>{t("teams.deleteTitle")}</h3>
          <p className="teamSettingsHint">{t("teams.deleteHint")}</p>
        </div>
        <div className="teamSettingsDangerAction">
          {confirmingDelete ? (
            <>
              <button type="button" className="teamSettingsDeleteConfirmButton" onClick={handleDelete} disabled={deleting}>
                {deleting ? t("teams.deleting") : t("teams.deleteConfirm")}
              </button>
              <button
                type="button"
                className="teamSettingsCancelButton"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                {t("teams.cancel")}
              </button>
            </>
          ) : (
            <button type="button" className="teamSettingsDeleteButton" onClick={() => setConfirmingDelete(true)}>
              {t("teams.deleteButton")}
            </button>
          )}
        </div>
      </div>
      {deleteError && <p className="teamSettingsError">{deleteError}</p>}
    </section>
  );
}
