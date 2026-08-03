import { ThemeShowcase } from "../components/ThemeShowcase";
import { EnvironmentShowcase } from "../components/EnvironmentShowcase";
import { useLanguage } from "../i18n/LanguageContext";
import "./SettingsPage.css";

export function SettingsPage() {
  const { t } = useLanguage();
  return (
    <div id="mainBody" className="settingsPage">
      <h1>{t("settings.title")}</h1>
      <p className="settingsPageIntro">{t("settings.intro")}</p>
      <ThemeShowcase />
      <EnvironmentShowcase />
    </div>
  );
}
