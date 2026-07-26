import { useTheme } from "../theme/ThemeContext";
import { TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_STEP } from "../theme/themeOptions";
import { useLanguage } from "../i18n/LanguageContext";
import "./TextSizeSlider.css";
import "./ThemeShowcase.css";

const KOREAN_SAMPLE = "나는 선한 목자라 나는 내 양을 알고 양도 나를 아는 것이";
const ENGLISH_SAMPLE = "I am the good shepherd; I know my sheep and my sheep know me.";

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

      <h3 className="themeShowcaseSubtitle">{t("settings.sample")}</h3>

      <div className="fontSample textSizeSample">
        <p className="bibText textSizeSampleText">{KOREAN_SAMPLE}</p>
        <p className="bibText textSizeSampleText">{ENGLISH_SAMPLE}</p>
      </div>
    </div>
  );
}
