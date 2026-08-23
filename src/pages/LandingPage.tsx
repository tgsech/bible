import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { meta as nivEn } from "../bible-data/translations/niv-en/meta";
import { meta as krvKo } from "../bible-data/translations/krv-ko/meta";
import { useLanguage } from "../i18n/LanguageContext";
import { useSession } from "../lib/authClient";
import { api } from "../lib/api";
import type { TranslationMeta } from "../bible-data/types";
import { WeeklyActivityCalendar } from "../components/WeeklyActivityCalendar";
import {
  FlameIcon,
  TypingIcon,
  ReadIcon,
  SparkleIcon,
  ChevronRightIcon,
  LeaderboardIcon,
  DirectoryIcon,
} from "../components/NavIcons";
import "./LandingPage.css";

const TRANSLATIONS = [nivEn, krvKo];

function bookName(translationId: string, bookId: string): string {
  return TRANSLATIONS.find((t) => t.id === translationId)?.books.find((b) => b.id === bookId)?.name ?? bookId;
}

// Total chapters in a translation - sum of every book's chapter count.
// Used as the denominator for the "X of Y chapters" mini progress bars,
// the same figure the earlier design conversation flagged as worth
// surfacing (e.g. "of 1189 chapters" for NIV) since it's already sitting
// in the bundled meta rather than needing a new backend stat.
function totalChapters(translation: TranslationMeta): number {
  return translation.books.reduce((sum, b) => sum + b.versesPerChapter.length, 0);
}

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

function BookGrid() {
  return (
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
  );
}

interface ProgressPosition {
  translationId: string;
  bookId: string;
  chapter: number;
  verseIndex: number;
}
interface ReadingPosition {
  translationId: string;
  bookId: string;
  chapter: number;
}
interface CompletionRow {
  translationId: string;
  bookId: string;
  chapter: number;
}

interface HomeSummary {
  latestPosition: ProgressPosition | null;
  latestReadingPosition: ReadingPosition | null;
  completions: CompletionRow[];
  overall: { chaptersCompleted: number };
  streak: { current: number; longest: number };
}

// Distinct chapters completed within one specific translation - the
// numerator for that translation's mini progress bar. `overall.chaptersCompleted`
// from the summary mixes both translations together, which stops being
// useful once you want "how much of the NIV specifically have I covered"
// as its own number, so this re-derives it from the full `completions`
// list the summary already includes rather than asking the backend for a
// new stat.
function chaptersCompletedIn(completions: CompletionRow[], translationId: string): number {
  return new Set(
    completions.filter((c) => c.translationId === translationId).map((c) => `${c.bookId}:${c.chapter}`)
  ).size;
}

function ContinueCard({
  icon,
  label,
  bookLabel,
  chapterLabel,
  to,
  cta,
}: {
  icon: ReactNode;
  label: string;
  bookLabel: string;
  chapterLabel: string;
  to: string;
  cta: string;
}) {
  return (
    <Link to={to} className="continueCard">
      <span className="continueCardIcon">{icon}</span>
      <span className="continueCardBody">
        <span className="continueCardLabel">{label}</span>
        <span className="continueCardWhere">
          {bookLabel} {chapterLabel}
        </span>
      </span>
      <span className="continueCardCta">
        {cta} <ChevronRightIcon />
      </span>
    </Link>
  );
}

function ComingSoonCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="comingSoonCard">
      <span className="comingSoonBadge">
        <SparkleIcon /> {title}
      </span>
      <p className="comingSoonBody">{body}</p>
    </div>
  );
}

// Signed-in view: answers "what do I do right now" in the first fold
// (continue card(s), streak + weekly activity, per-translation progress),
// then the coming-soon slots, then the book grid demoted to "browse all
// books" rather than being the first thing shown - see the home-page
// redesign conversation this replaces LandingPage's old single-branch
// layout with.
function SignedInHome({ name }: { name: string }) {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<HomeSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<HomeSummary>("/profile/summary")
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch((err) => console.error("Failed to load home summary", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const { latestPosition, latestReadingPosition, streak, completions } = summary ?? {
    latestPosition: null,
    latestReadingPosition: null,
    streak: { current: 0, longest: 0 },
    completions: [],
  };

  return (
    <div id="mainBody" className="landingPage homeSignedIn">
      <section className="homeGreeting">
        <h1 className="homeGreetingTitle">{t("home.welcomeBack", { name })}</h1>
        <p className="homeGreetingSubtitle">{t("home.welcomeBackSubtitle")}</p>
      </section>

      {(latestPosition || latestReadingPosition) && (
        <section className="continueSection">
          {latestPosition && (
            <ContinueCard
              icon={<TypingIcon />}
              label={t("home.continueTyping")}
              bookLabel={bookName(latestPosition.translationId, latestPosition.bookId)}
              chapterLabel={String(latestPosition.chapter)}
              to={`/read/${latestPosition.translationId}/${latestPosition.bookId}/${latestPosition.chapter}`}
              cta={t("home.resume")}
            />
          )}
          {latestReadingPosition && (
            <ContinueCard
              icon={<ReadIcon />}
              label={t("home.continueReading")}
              bookLabel={bookName(latestReadingPosition.translationId, latestReadingPosition.bookId)}
              chapterLabel={String(latestReadingPosition.chapter)}
              to={`/read/${latestReadingPosition.translationId}/${latestReadingPosition.bookId}/${latestReadingPosition.chapter}`}
              cta={t("home.resume")}
            />
          )}
        </section>
      )}

      <section className="statsStrip">
        <div className="statsStripStreak">
          <FlameIcon className="statsStripFlame" />
          <div>
            <span className="statsStripStreakValue">{streak.current}</span>
            <span className="statsStripStreakLabel">
              {t(streak.current === 1 ? "home.streakDay" : "home.streakDays")}
            </span>
          </div>
          {streak.longest > streak.current && (
            <span className="statsStripBest">{t("home.longestStreak", { count: streak.longest })}</span>
          )}
        </div>
        <WeeklyActivityCalendar />
      </section>

      <section className="translationProgress">
        {TRANSLATIONS.map((translation) => {
          const done = chaptersCompletedIn(completions, translation.id);
          const total = totalChapters(translation);
          const pct = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
          return (
            <div key={translation.id} className="translationProgressRow">
              <div className="translationProgressLabel">
                <span>{translation.name}</span>
                <span className="translationProgressCount">{t("home.chaptersOf", { done, total })}</span>
              </div>
              <div className="translationProgressBar">
                <div className="translationProgressFill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="comingSoonRow">
        <ComingSoonCard title={t("home.dailyVerseTitle")} body={t("home.dailyVerseBody")} />
        <ComingSoonCard title={t("home.readingPlanTitle")} body={t("home.readingPlanBody")} />
      </section>

      <h2 className="browseBooksHeading">{t("home.browseAllBooks")}</h2>
      <BookGrid />
    </div>
  );
}

// Signed-out view: actually explains the product instead of assuming a
// developer is standing next to the visitor - a short "what is this"
// section, one clear primary action, a light preview of leaderboard/teams/
// customization, then the book grid still available but demoted below all
// of that rather than being the entire page.
function SignedOutHome() {
  const { t } = useLanguage();

  return (
    <div id="mainBody" className="landingPage">
      <section className="landingHero">
        <h1 className="landingTitle">
          LivingWords <span className="landingTitleKo">살아있는 말씀</span>
        </h1>
        <p className="landingTagline">{t("landing.subtitle")}</p>

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
      </section>

      <div className="landingDivider" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <section className="explainerSection">
        <div className="explainerCard">
          <h2>
            <TypingIcon /> {t("home.explainTypingTitle")}
          </h2>
          <p>{t("home.explainTypingBody")}</p>
        </div>
        <div className="explainerCard">
          <h2>
            <ReadIcon /> {t("home.explainReadingTitle")}
          </h2>
          <p>{t("home.explainReadingBody")}</p>
        </div>
      </section>

      <section className="featureHighlights">
        <Link to="/leaderboard" className="featureHighlight">
          <LeaderboardIcon />
          <span>{t("home.featureLeaderboard")}</span>
        </Link>
        <Link to="/livworders" className="featureHighlight">
          <DirectoryIcon />
          <span>{t("home.featureTeams")}</span>
        </Link>
        <Link to="/settings" className="featureHighlight">
          <SparkleIcon />
          <span>{t("home.featureCustomize")}</span>
        </Link>
      </section>

      <h2 className="browseBooksHeading">{t("home.browseAllBooks")}</h2>
      <BookGrid />
    </div>
  );
}

// Kept as one component branching on session, in one file/route - two
// separate routes would make "the home page" an ambiguous concept for
// anything that links to "/", and the two views diverge enough (progress
// dashboard vs. explainer content) that they're forced into sub-components
// rather than one shared markup tree, without needing a second route to do
// that split.
export function LandingPage() {
  const { data: session } = useSession();

  if (session) {
    return <SignedInHome name={session.user.name} />;
  }
  return <SignedOutHome />;
}
