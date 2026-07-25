import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./LivWordersPage.css";

export function LivWordersPage() {
  const { t } = useLanguage();
  return (
    <div id="mainBody" className="livWordersPage">
      <h1>{t("livworders.title")}</h1>
      <p>{t("livworders.body")}</p>
      <Link to="/">{t("common.backHome")}</Link>
    </div>
  );
}
