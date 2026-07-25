import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./AboutPage.css";

export function AboutPage() {
  const { t } = useLanguage();
  return (
    <div id="mainBody" className="aboutPage">
      <h1>{t("about.title")}</h1>
      <p>{t("about.intro")}</p>
      <p>
          Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.
      </p>
      <p>{t("about.licensing")}</p>
      <p>성경전서 개역한글판 (Korean Revised Version, KRV)</p>
      <Link to="/">{t("common.backHome")}</Link>
    </div>
  );
}
