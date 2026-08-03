import { useEnvironment } from "../environment/EnvironmentContext";
import { useLanguage } from "../i18n/LanguageContext";
import "./EnvironmentShowcase.css";

export function EnvironmentShowcase() {
  const { t } = useLanguage();
  const { manualAdvance, wordProcessorMode, setManualAdvance, setWordProcessorMode } = useEnvironment();

  return (
    <section className="environmentShowcase">
      <h2 className="themeShowcaseTitle">{t("settings.environmentTitle")}</h2>
      <div className="environmentToggleList">
        <label className="environmentToggle">
          <input
            type="checkbox"
            checked={manualAdvance}
            onChange={(e) => setManualAdvance(e.target.checked)}
          />
          <span className="environmentToggleText">
            <span className="environmentToggleLabel">{t("settings.manualAdvanceLabel")}</span>
            <span className="environmentToggleDescription">{t("settings.manualAdvanceDescription")}</span>
          </span>
        </label>

        <label className="environmentToggle">
          <input
            type="checkbox"
            checked={wordProcessorMode}
            onChange={(e) => setWordProcessorMode(e.target.checked)}
          />
          <span className="environmentToggleText">
            <span className="environmentToggleLabel">{t("settings.wordProcessorModeLabel")}</span>
            <span className="environmentToggleDescription">
              {t("settings.wordProcessorModeDescription")}
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
