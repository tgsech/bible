import { FONTS } from "../theme/themeOptions";
import { useTheme } from "../theme/ThemeContext";
import "./FontPicker.css";
import { useLanguage } from "../i18n/LanguageContext";
import "./ThemeShowcase.css";

const KOREAN_SAMPLE =
  "나는 선한 목자라 나는 내 양을 알고 양도 나를 아는 것이 아버지께서 나를 아시고 내가 아버지를 아는 것 같으니 나는 양을 위하여 목숨을 버리노라\n" +
  "— 요한복음 10장 14~15절";

const ENGLISH_SAMPLE =
  "I am the good shepherd; I know my sheep and my sheep know me— just as the Father knows me and I know the Father—and I lay down my life for the sheep.\n" +
  "— John 10:14-15 (NIV)";

export function FontPicker() {
  const { font, setFontId } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="fontPicker">
      <label className="fontPickerLabel">
        <select value={font.id} onChange={(e) => setFontId(e.target.value)}>
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      <h3 className="themeShowcaseSubtitle">{t("settings.sample")}</h3>

      <div className="fontSample" style={{ fontFamily: font.cssFontFamily }}>
        <p className="fontSampleText">{KOREAN_SAMPLE}</p>
        <p className="fontSampleText">{ENGLISH_SAMPLE}</p>
      </div>
    </div>
  );
}
