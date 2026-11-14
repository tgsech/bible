import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { PASSAGE, VERSE_NUMBERS, type PassageLang } from "../memory/passage";
import {
  daysUntilContest,
  overallMastery,
  resetProgress,
  setPassageLang,
  useMemory,
  useMemoryAccountSync,
  verseState,
} from "../memory/store";
import { fmtMinutes } from "../memory/text";
import { Meter, PaceNote } from "../memory/ui";
import "./MemoryToolPage.css";

const MODE_GROUPS: { group: string; modes: { id: string; icon: string }[] }[] = [
  {
    group: "game",
    modes: [
      { id: "rain", icon: "🌧️" },
      { id: "order", icon: "🧩" },
    ],
  },
  {
    group: "study",
    modes: [
      { id: "vanish", icon: "🫥" },
      { id: "letters", icon: "🔤" },
      { id: "cards", icon: "🗂️" },
      { id: "speak", icon: "🎙️" },
    ],
  },
  { group: "test", modes: [{ id: "test", icon: "📝" }] },
];

export function MemoryToolPage() {
  const { t } = useLanguage();
  const { lang, ls, passage } = useMemory();
  const [now] = useState(() => Date.now());
  const [confirmReset, setConfirmReset] = useState(false);
  const { signedIn } = useMemoryAccountSync();

  const overall = overallMastery(ls);
  const daysLeft = daysUntilContest(now);
  const dueCount = VERSE_NUMBERS.filter((v) => verseState(ls, v).due <= now).length;
  const dday =
    daysLeft > 0 ? t("memory.dday", { n: daysLeft }) : daysLeft === 0 ? t("memory.ddayToday") : t("memory.ddayPast");

  return (
    <div id="mainBody" className="memPage memHub">
      <header className="memHubHero">
        <p className="memEyebrow">{t("memory.eyebrow")}</p>
        <h1 className="memHubTitle">{passage.reference}</h1>
        <p className="memHubMeta">
          <span>{passage.version}</span>
          <span className="memPill">{dday}</span>
          <span>{t("memory.contestInfo")}</span>
        </p>
        <div className="memSeg" role="group" aria-label={t("memory.passageLang")}>
          {(["ko", "en"] as PassageLang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={lang === l ? "isActive" : ""}
              aria-pressed={lang === l}
              onClick={() => setPassageLang(l)}
            >
              {l === "ko" ? "한국어 · 개역개정" : "English · NIV"}
            </button>
          ))}
        </div>
      </header>

      <section className="memCard memProgress" aria-label={t("memory.progress.title")}>
        <div className="memProgressHead">
          <h2>{t("memory.progress.title")}</h2>
          <span className="memProgressPct">{Math.round(overall)}%</span>
        </div>
        <Meter value={overall} label={t("memory.progress.title")} />
        <PaceNote ls={ls} />
        <p className="memProgressSub">
          {t("memory.practiced", { time: fmtMinutes(Math.round(ls.practiceMs / 60_000), t) })}
          {ls.passedFull && <span className="memPill memPill--pass">🐑 {t("memory.passedBadge")}</span>}
        </p>
        <p className="memProgressSub">
          {signedIn ? (
            t("memory.sync.account")
          ) : (
            <>
              {t("memory.sync.guest")} <Link to="/auth">{t("memory.sync.signIn")}</Link>
            </>
          )}
        </p>
        <ul className="memVerseBars">
          {VERSE_NUMBERS.map((v) => {
            const m = Math.round(verseState(ls, v).m);
            return (
              <li key={v} title={`${passage.book} 1:${v} — ${m}%`}>
                <span className="memVerseBarTrack">
                  <span className="memVerseBarFill" style={{ height: `${m}%` }} />
                </span>
                <span className="memVerseBarNum">{v}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {MODE_GROUPS.map(({ group, modes }) => (
        <section key={group} className="memGroup">
          <h2>{t(`memory.group.${group}`)}</h2>
          <p className="memGroupNote">{t(`memory.group.${group}.note`)}</p>
          <div className="memModeGrid">
            {modes.map(({ id, icon }) => (
              <Link key={id} to={`/memory/${id}`} className={`memModeCard memModeCard--${group}`}>
                <span className="memModeIcon" aria-hidden="true">
                  {icon}
                </span>
                <span className="memModeName">
                  {t(`memory.mode.${id}.name`)}
                  {id === "cards" && dueCount > 0 && (
                    <span className="memPill">{t("memory.cards.due", { n: dueCount })}</span>
                  )}
                </span>
                <span className="memModeDesc">{t(`memory.mode.${id}.desc`)}</span>
                {group === "study" && <span className="memModeScience">{t(`memory.mode.${id}.science`)}</span>}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <details className="memCard memPassage">
        <summary>{t("memory.showPassage")}</summary>
        <ol>
          {VERSE_NUMBERS.map((v) => (
            <li key={v} value={v}>
              {passage.verses[v]}
            </li>
          ))}
        </ol>
      </details>

      <footer className="memFooter">
        <p>{PASSAGE[lang].source}</p>
        {confirmReset ? (
          <p>
            {t("memory.resetConfirm")}{" "}
            <button
              type="button"
              className="memLinkButton"
              onClick={() => {
                resetProgress(lang);
                setConfirmReset(false);
              }}
            >
              {t("memory.resetYes")}
            </button>{" "}
            <button type="button" className="memLinkButton" onClick={() => setConfirmReset(false)}>
              {t("memory.resetNo")}
            </button>
          </p>
        ) : (
          <button type="button" className="memLinkButton" onClick={() => setConfirmReset(true)}>
            {t("memory.reset")}
          </button>
        )}
      </footer>
    </div>
  );
}
