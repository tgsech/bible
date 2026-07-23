import { useState } from "react";
import { api, ApiError } from "../lib/api";

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
      setError(err instanceof ApiError ? err.message : "Something went wrong saving that.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="settingsForm" onSubmit={handleSubmit}>
      <label className="settingsField">
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Shown on the leaderboard and directory instead of your name"
          maxLength={20}
        />
      </label>

      <label className="settingsField">
        <span>About me</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio for your public card"
          maxLength={280}
          rows={3}
        />
      </label>

      <label className="settingsField">
        <span>Current mood</span>
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="e.g. Slowly making it through Psalms 🌱"
          maxLength={80}
        />
      </label>

      {error && <p className="settingsError">{error}</p>}
      {savedJustNow && !error && <p className="settingsSaved">Saved!</p>}

      <button type="submit" className="settingsSaveButton" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
