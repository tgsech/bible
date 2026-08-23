import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./TutorialPage.css";

export function TutorialPage() {
  const { t } = useLanguage();

  return (
    <div id="mainBody" className="tutorialPage">
      <h1>{t("tutorial.title")}</h1>
      <p className="tutorialIntro">{t("tutorial.intro")}</p>

      <section className="tutorialSection">
        <h2>{t("tutorial.typing.title")}</h2>
        <p>{t("tutorial.typing.body")}</p>
      </section>

      <section className="tutorialSection">
        <h2>{t("tutorial.reading.title")}</h2>
        <p>{t("tutorial.reading.body")}</p>
      </section>

      <section className="tutorialSection">
        <h2>{t("tutorial.progress.title")}</h2>
        <p>{t("tutorial.progress.body")}</p>
      </section>

      <section className="tutorialSection">
        <h2>{t("tutorial.bookmarks.title")}</h2>
        <p>{t("tutorial.bookmarks.body")}</p>
      </section>

      <section className="tutorialSection">
        <h2>{t("tutorial.leaderboard.title")}</h2>
        <p>{t("tutorial.leaderboard.body")}</p>
      </section>

      <section className="tutorialSection">
        <h2>{t("tutorial.livworders.title")}</h2>
        <p>{t("tutorial.livworders.body")}</p>
      </section>

      <section className="tutorialSection">
        <h2>{t("tutorial.settings.title")}</h2>
        <p>{t("tutorial.settings.body")}</p>
      </section>

      <section className="tutorialSection">
        <h2>{t("tutorial.account.title")}</h2>
        <p>{t("tutorial.account.body")}</p>
      </section>

      <Link to="/">{t("common.backHome")}</Link>
    </div>
  );
}
