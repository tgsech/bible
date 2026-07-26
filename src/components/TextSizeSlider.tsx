import { useTheme } from "../theme/ThemeContext";
import { TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_STEP } from "../theme/themeOptions";
import { useLanguage } from "../i18n/LanguageContext";
import "./TextSizeSlider.css";
import "./ThemeShowcase.css";

export function TextSizeSlider() {
  const { textScale, setTextScale } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="textSizeSlider">
      <label className="textSizeSliderLabel">
        <span className="textSizeSliderValue">{Math.round(textScale * 100)}%</span>
        <input
          type="range"
          className="textSizeSliderInput"
          min={TEXT_SCALE_MIN}
          max={TEXT_SCALE_MAX}
          step={TEXT_SCALE_STEP}
          value={textScale}
          onChange={(e) => setTextScale(Number(e.target.value))}
          aria-label={t("settings.textSize")}
        />
      </label>
    </div>
  );
}
