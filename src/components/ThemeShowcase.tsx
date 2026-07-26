import { ColorPaletteGrid } from "./ColorPaletteGrid";
import { FontPicker } from "./FontPicker";
import { TextSizeSlider } from "./TextSizeSlider";
import { useLanguage } from "../i18n/LanguageContext";
import "./ThemeShowcase.css";

export function ThemeShowcase() {
  const { t } = useLanguage();
  return (
    <section className="themeShowcase">
      <h2 className="themeShowcaseTitle">{t("settings.themesTitle")}</h2>
      <div className="themeShowcaseColumns">
        <div className="themeShowcaseColumn">
          <h3 className="themeShowcaseSubtitle">{t("settings.colorSets")}</h3>
          <ColorPaletteGrid />
        </div>
        <div className="themeShowcaseColumn">
          <h3 className="themeShowcaseSubtitle">{t("settings.font")}</h3>
          <FontPicker />
        </div>
        <div className="themeShowcaseColumn">
          <h3 className="themeShowcaseSubtitle">{t("settings.textSize")}</h3>
          <TextSizeSlider />
        </div>
      </div>
    </section>
  );
}
