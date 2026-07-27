import { Link } from "react-router-dom";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import { useLanguage } from "../i18n/LanguageContext";
import { useSession } from "../lib/authClient";
import type { TranslationMeta } from "../bible-data/types";
import "./LandingPage.css";

const TRANSLATIONS = [nivEn, krvKo];

// Books already come ordered Old Testament -> New Testament with a `group`
// label per book (already localized per-translation, e.g. "Old Testament"
// vs "구약성경" - see bible-data/translations/*/meta.ts), so grouping is
// just "start a new bucket whenever the label changes" rather than
// anything that needs a lookup table.
function groupByTestament(books: TranslationMeta["books"]) {
  const groups: { group: string; books: TranslationMeta["books"] }[] = [];
  for (const book of books) {
    const current = groups[groups.length - 1];
    if (current && current.group === book.group) {
      current.books.push(book);
    } else {
      groups.push({ group: book.group, books: [book] });
    }
  }
  return groups;
}

export function LandingPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();

  return (
    <div id="mainBody" className="landingPage">
      <section className="landingHero">
        <h1 className="landingTitle">
          LivingWords <span className="landingTitleKo">살아있는 말씀</span>
        </h1>
        <p className="landingTagline">{t("landing.subtitle")}</p>

        {session ? (
          <div className="landingCta">
            <p className="landingWelcome">{t("landing.welcomeBack", { name: session.user.name })}</p>
            <p className="landingCtaNote">{t("landing.welcomeBackSubtitle")}</p>
            <div className="landingCtaButtons">
              <Link to="/profile" className="landingButton landingButton--primary">
                {t("landing.goToProfile")}
              </Link>
              <Link to="/leaderboard" className="landingButton landingButton--ghost">
                {t("landing.viewLeaderboard")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="landingCta">
            <div className="landingCtaButtons">
              <Link to="/auth?mode=signup" className="landingButton landingButton--primary">
                {t("landing.signUpCta")}
              </Link>
              <Link to="/auth" className="landingButton landingButton--ghost">
                {t("landing.signInCta")}
              </Link>
            </div>
            <p className="landingCtaNote">{t("landing.loginRemind")}</p>
          </div>
        )}

        <Link to="/settings" className="landingSettingsNote">
          {t("landing.customizeNote")}
        </Link>
      </section>

      <div className="landingDivider" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <section className="bookLists">
        {TRANSLATIONS.map((translation) => (
          <div key={translation.id} className="bookListColumn">
            <h2 className="bookListTitle">{translation.name}</h2>
            {groupByTestament(translation.books).map(({ group, books }) => (
              <div key={group} className="bookGroup">
                <h3 className="bookGroupTitle">{group}</h3>
                <ul className="bookList">
                  {books.map((book) => (
                    <li key={book.id}>
                      <Link className="bookChip" to={`/read/${translation.id}/${book.id}/1`}>
                        {book.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
