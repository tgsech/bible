import { Link } from "react-router-dom";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import "./LandingPage.css";

const TRANSLATIONS = [nivEn, krvKo];

export function LandingPage() {
  return (
    <div id="mainBody" className="landingPage">
      <header className="landingHeader">
        <h1 className="landingTitle">LivingWords - 살아있는 말씀</h1>
        <p className="landingSubtitle">말씀과 함께하는 삶~~~!</p>
      </header>

      {/* <section className="languagePick">
        {TRANSLATIONS.map((t) => (
          <Link key={t.id} className="languagePickButton" to={`/read/${t.id}/${t.books[0].id}/1`}>
            {t.language === "ko" ? "한국어" : "English"}
          </Link>
        ))}
      </section> */}

      <section className="bookLists">
        {TRANSLATIONS.map((t) => (
          <div key={t.id} className="bookListColumn">
            <h2 className="bookListTitle">{t.name}</h2>
            <ul className="bookList">
              {t.books.map((b) => (
                <li key={b.id}>
                  <Link className="bookListLink" to={`/read/${t.id}/${b.id}/1`}>
                     {b.name} |
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
