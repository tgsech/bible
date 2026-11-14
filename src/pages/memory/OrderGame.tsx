import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { VERSE_NUMBERS } from "../../memory/passage";
import { recordPractice, useMemory } from "../../memory/store";
import { norm, nowMs, shuffle, tokenize } from "../../memory/text";
import { ModeShell, VersePicker } from "../../memory/ui";

// Word Puzzle: the verse's words are scrambled; tap them back into order.
// No typing, so it works well on a phone.

const CAP = 55;

interface Chip {
  id: number;
  word: string;
}

function Round({ verse, onNext }: { verse: number; onNext: () => void }) {
  const { t } = useLanguage();
  const { lang, passage } = useMemory();
  const [tokens] = useState(() => tokenize(passage.verses[verse]));
  const [chips, setChips] = useState<Chip[]>(() => shuffle(tokens.map((word, id) => ({ id, word }))));
  const [placed, setPlaced] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());

  const done = placed >= tokens.length;
  const accuracy = Math.round((tokens.length / (tokens.length + mistakes)) * 100);

  const tap = (chip: Chip) => {
    if (norm(chip.word) !== norm(tokens[placed])) {
      setMistakes((m) => m + 1);
      setWrongId(chip.id);
      return;
    }
    setWrongId(null);
    setChips((cs) => cs.filter((c) => c.id !== chip.id));
    const nextPlaced = placed + 1;
    setPlaced(nextPlaced);
    if (nextPlaced >= tokens.length) {
      recordPractice(lang, [{ verse, accuracy, cap: CAP }], Math.min(nowMs() - startedAt, 10 * 60_000));
    }
  };

  return (
    <>
      <div className="memCard memOrderBuilt" aria-live="polite">
        <span className="memRainBuiltRef">
          {passage.book} 1:{verse}
        </span>{" "}
        {tokens.slice(0, placed).join(" ")}
        {!done && <span className="memOrderCaret" />}
      </div>
      {!done ? (
        <>
          <div className="memChips">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`memChip${wrongId === chip.id ? " isWrong" : ""}`}
                onClick={() => tap(chip)}
                onAnimationEnd={() => setWrongId(null)}
              >
                {chip.word}
              </button>
            ))}
          </div>
          <p className="memHint">{t("memory.order.mistakes", { n: mistakes })}</p>
        </>
      ) : (
        <div className="memCard memResult">
          <p className="memResultEmoji" aria-hidden="true">
            🧩
          </p>
          <h2>{t("memory.order.done")}</h2>
          <p className="memResultScore">{accuracy}%</p>
          <p>{t("memory.order.mistakes", { n: mistakes })}</p>
          <div className="memActions">
            <button type="button" className="memButton memButton--primary" autoFocus onClick={onNext}>
              {t("memory.nextVerse")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OrderGame() {
  const { lang } = useMemory();
  const [verse, setVerse] = useState(17);
  const [round, setRound] = useState(0);
  const next = () => {
    const idx = VERSE_NUMBERS.indexOf(verse as (typeof VERSE_NUMBERS)[number]);
    setVerse(VERSE_NUMBERS[(idx + 1) % VERSE_NUMBERS.length]);
    setRound((r) => r + 1);
  };
  return (
    <ModeShell mode="order">
      <VersePicker
        value={verse}
        onChange={(v) => {
          if (v !== "all") {
            setVerse(v);
            setRound((r) => r + 1);
          }
        }}
      />
      <Round key={`${lang}-${verse}-${round}`} verse={verse} onNext={next} />
    </ModeShell>
  );
}
