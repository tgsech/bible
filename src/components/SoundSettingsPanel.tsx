import { useSound } from "../audio/SoundContext";
import { ERROR_SOUND_OPTIONS, COMPLETION_SOUND_OPTIONS } from "../audio/sounds";
import { useLanguage } from "../i18n/LanguageContext";
import "./SoundSettingsPanel.css";

export function SoundSettingsPanel() {
  const { t } = useLanguage();
  const {
    soundsEnabled,
    errorSoundId,
    completionSoundId,
    setSoundsEnabled,
    setErrorSoundId,
    setCompletionSoundId,
    previewError,
    previewCompletion,
  } = useSound();

  return (
    <section className="environmentShowcase">
      <h2 className="themeShowcaseTitle">{t("settings.soundTitle")}</h2>
      <div className="environmentToggleList">
        <label className="environmentToggle">
          <input type="checkbox" checked={soundsEnabled} onChange={(e) => setSoundsEnabled(e.target.checked)} />
          <span className="environmentToggleText">
            <span className="environmentToggleLabel">{t("settings.soundEnabledLabel")}</span>
            <span className="environmentToggleDescription">{t("settings.soundEnabledDescription")}</span>
          </span>
        </label>

        <div className="soundPickerRow">
          <span className="environmentToggleLabel">{t("settings.errorSoundLabel")}</span>
          <div className="soundPickerControls">
            <select value={errorSoundId ?? ""} onChange={(e) => setErrorSoundId(e.target.value || null)}>
              {ERROR_SOUND_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" className="soundPreviewButton" onClick={previewError}>
              {t("settings.soundPreview")}
            </button>
          </div>
        </div>

        <div className="soundPickerRow">
          <span className="environmentToggleLabel">{t("settings.completionSoundLabel")}</span>
          <div className="soundPickerControls">
            <select
              value={completionSoundId ?? ""}
              onChange={(e) => setCompletionSoundId(e.target.value || null)}
            >
              {COMPLETION_SOUND_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" className="soundPreviewButton" onClick={previewCompletion}>
              {t("settings.soundPreview")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
