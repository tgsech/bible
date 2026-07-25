import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./MemoryToolPage.css";

export function MemoryToolPage() {
  const { t } = useLanguage();
  return (
    <div id="mainBody" className="memoryToolPage">
      <h1>{t("memory.title")}</h1>
      <p>{t("memory.body")}</p>
      <Link to="/">{t("common.backHome")}</Link>
    </div>
  );
}
