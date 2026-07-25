import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { useLanguage } from "../i18n/LanguageContext";

interface ProfileSettings {
  userId: string;
  username: string | null;
  bio: string | null;
  mood: string | null;
}

interface Props {
  settings: ProfileSettings;
  onSaved: (settings: ProfileSettings) => void;
}

// Sends `null` for a field the person cleared out entirely (vs. omitting a
// field that was never touched) — matches what PUT /profile/settings
// expects: omitted = leave alone, null = clear, string = set.
function toPayload(value: string, original: string | null) {
  if (value === "") return original === null ? undefined : null;
  return value === (original ?? "") ? undefined : value;
}

export function ProfileSettingsForm({ settings, onSaved }: Props) {
  const [username, setUsername] = useState(settings.username ?? "");
  const [bio, setBio] = useState(settings.bio ?? "");
  const [mood, setMood] = useState(settings.mood ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedJustNow(false);

    const payload = {
      username: toPayload(username.trim(), settings.username),
      bio: toPayload(bio.trim(), settings.bio),
      mood: toPayload(mood.trim(), settings.mood),
    };

    try {
      const updated = await api.put<ProfileSettings>("/profile/settings", payload);
      if (updated) {
        onSaved(updated);
        setSavedJustNow(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("form.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="settingsForm" onSubmit={handleSubmit}>
      <label className="settingsField">
        <span>{t("form.username")}</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("form.usernamePlaceholder")}
          maxLength={20}
        />
      </label>

      <label className="settingsField">
        <span>{t("form.aboutMe")}</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("form.aboutMePlaceholder")}
          maxLength={280}
          rows={3}
        />
      </label>

      <label className="settingsField">
        <span>{t("form.moodLabel")}</span>
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder={t("form.moodPlaceholder")}
          maxLength={80}
        />
      </label>

      {error && <p className="settingsError">{error}</p>}
      {savedJustNow && !error && <p className="settingsSaved">{t("common.saved")}</p>}

      <button type="submit" className="settingsSaveButton" disabled={saving}>
        {saving ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
