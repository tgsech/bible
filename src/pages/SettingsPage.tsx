import { ThemeShowcase } from "../components/ThemeShowcase";
import "./SettingsPage.css";

export function SettingsPage() {
  return (
    <div id="mainBody" className="settingsPage">
      <h1>Settings</h1>
      <p className="settingsPageIntro">Pick a color set and font. Both follow your account across devices.</p>
      <ThemeShowcase />
    </div>
  );
}
