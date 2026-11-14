import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { VERSE_NUMBERS } from "../../memory/passage";
import { rateCard, useMemory, verseState, type CardRating } from "../../memory/store";
import { ModeShell } from "../../memory/ui";

// Spaced Review: the contest calls out a verse number, so the card front
// is just the reference. Recite out loud, flip, and rate yourself; the
// rating decides how many days until that verse comes back (Leitner boxes,
// see BOX_DAYS in store.ts).

function Session({ initial }: { initial: number[] }) {
  const { t, lang: siteLang } = useLanguage();
  const { lang, ls, passage } = useMemory();
  const [queue, setQueue] = useState(initial);
  const [revealed, setRevealed] = useState(false);
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [now] = useState(() => Date.now());

  if (queue.length === 0) {
    const nextDue = Math.min(...VERSE_NUMBERS.map((v) => verseState(ls, v).due));
    return (
      <div className="memCard memResult">
        <p className="memResultEmoji" aria-hidden="true">
          🌿
        </p>
        <h2>{t("memory.cards.doneToday")}</h2>
        {nextDue > now && (
          <p>
            {t("memory.cards.nextDue", {
              when: new Date(nextDue).toLocaleDateString(siteLang === "ko" ? "ko-KR" : "en-US", {
                month: "long",
                day: "numeric",
                weekday: "short",
              }),
            })}
          </p>
        )}
        <div className="memActions">
          <button
            type="button"
            className="memButton"
            onClick={() => {
              setQueue([...VERSE_NUMBERS]);
              setShownAt(Date.now());
            }}
          >
            {t("memory.cards.practiceAnyway")}
          </button>
        </div>
      </div>
    );
  }

  const verse = queue[0];
  const rate = (rating: CardRating) => {
    rateCard(lang, verse, rating, Math.min(Date.now() - shownAt, 3 * 60_000));
    // "Again" goes to the back of today's pile instead of leaving it.
    setQueue(rating === "again" ? [...queue.slice(1), verse] : queue.slice(1));
    setRevealed(false);
    setShownAt(Date.now());
  };

  return (
    <>
      <p className="memHint">{t("memory.cards.left", { n: queue.length })}</p>
      <div className="memCard memFlash">
        <p className="memFlashRef">
          {passage.book} 1:{verse}
        </p>
        {revealed ? <p className="memFlashText">{passage.verses[verse]}</p> : <p className="memFlashPrompt">{t("memory.cards.prompt")}</p>}
      </div>
      {revealed ? (
        <div className="memActions memActions--rate">
          <button type="button" className="memButton memRate memRate--again" onClick={() => rate("again")}>
            {t("memory.cards.again")}
            <small>{t("memory.cards.againNote")}</small>
          </button>
          <button type="button" className="memButton memRate" onClick={() => rate("hard")}>
            {t("memory.cards.hard")}
            <small>{t("memory.cards.hardNote")}</small>
          </button>
          <button type="button" className="memButton memRate memRate--good" onClick={() => rate("good")}>
            {t("memory.cards.good")}
            <small>{t("memory.cards.goodNote")}</small>
          </button>
        </div>
      ) : (
        <div className="memActions">
          <button type="button" className="memButton memButton--primary" autoFocus onClick={() => setRevealed(true)}>
            {t("memory.cards.reveal")}
          </button>
        </div>
      )}
    </>
  );
}

export function FlashcardMode() {
  const { lang, ls } = useMemory();
  // Today's pile is fixed when the page opens; rating cards changes their
  // due dates, which must not reshuffle the session underneath you.
  const [initial] = useState(() => {
    const now = Date.now();
    return VERSE_NUMBERS.filter((v) => verseState(ls, v).due <= now);
  });
  return (
    <ModeShell mode="cards">
      <Session key={lang} initial={initial} />
    </ModeShell>
  );
}
