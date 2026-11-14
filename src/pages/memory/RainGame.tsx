import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { VERSE_NUMBERS } from "../../memory/passage";
import { recordPractice, useMemory } from "../../memory/store";
import { PLAIN_TEXT_FIELD, hintWord, maskWord, norm, nowMs, tokenize } from "../../memory/text";
import { ModeShell, VersePicker } from "../../memory/ui";

// Word Rain: the verse's words fall in order and you type each one before
// it lands. The memory twist is the difficulty setting - on "first letter"
// and "hidden" the falling words stop showing the text, so you can only
// clear them if you know what comes next.

/** Most mastery each difficulty can prove (see store.ts). */
const LEVEL_CAP = [45, 65, 85];
/** Seconds a word takes to fall, by speed setting. */
const FALL_SECONDS = [15, 10.5, 7.5];
const LIVES = 5;

interface Item {
  word: string;
  verse: number;
}
interface Drop {
  i: number;
  x: number;
}
interface Game {
  /** index of the word that must be typed next */
  cur: number;
  /** index of the next word to start falling */
  next: number;
  drops: Drop[];
  lives: number;
  /** per word: true cleared, false missed, undefined not yet reached */
  hits: (boolean | undefined)[];
  lastMiss: string | null;
}

function spawn(g: Game, total: number): Game {
  if (g.next >= total) return g;
  return { ...g, next: g.next + 1, drops: [...g.drops, { i: g.next, x: 4 + Math.random() * 92 }] };
}

export function RainGame() {
  const { t } = useLanguage();
  const { lang, passage } = useMemory();
  const [verse, setVerse] = useState<number | "all">(17);
  const [level, setLevel] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
  const [game, setGame] = useState<Game | null>(null);
  // The ref is the source of truth for handlers (timers and animation
  // events fire between renders); `game` state is just what's drawn.
  const gref = useRef<Game | null>(null);
  const startRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const enterPending = useRef(false);

  const items = useMemo<Item[]>(() => {
    const verses = verse === "all" ? [...VERSE_NUMBERS] : [verse];
    return verses.flatMap((v) => tokenize(passage.verses[v]).map((word) => ({ word, verse: v })));
  }, [verse, passage]);

  const apply = (g: Game) => {
    gref.current = g;
    setGame(g);
    if (g.cur >= items.length || g.lives <= 0) finish(g);
  };

  const finish = (g: Game) => {
    const byVerse = new Map<number, { hit: number; total: number }>();
    items.forEach((it, i) => {
      const rec = byVerse.get(it.verse) ?? { hit: 0, total: 0 };
      rec.total++;
      if (g.hits[i]) rec.hit++;
      byVerse.set(it.verse, rec);
    });
    recordPractice(
      lang,
      [...byVerse].map(([v, r]) => ({ verse: v, accuracy: (r.hit / r.total) * 100, cap: LEVEL_CAP[level] })),
      Math.min(nowMs() - startRef.current, 20 * 60_000),
    );
    setPhase("done");
  };

  const start = () => {
    startRef.current = nowMs();
    const g = spawn({ cur: 0, next: 0, drops: [], lives: LIVES, hits: [], lastMiss: null }, items.length);
    gref.current = g;
    // Render the playing screen right now, inside the tap, so the input
    // exists and can be focused as part of the same user gesture - the
    // only way iOS Safari will bring up the keyboard.
    flushSync(() => {
      setGame(g);
      setPhase("playing");
    });
    inputRef.current?.focus();
  };

  // Keep words coming on a steady beat while the round is live.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      const g = gref.current;
      if (!g || g.next >= items.length) return;
      const ng = spawn(g, items.length);
      gref.current = ng;
      setGame(ng);
    }, (FALL_SECONDS[speed] * 1000) / 4.5);
    return () => clearInterval(id);
  }, [phase, speed, items.length]);

  const resolve = (i: number, hit: boolean) => {
    const g = gref.current;
    if (!g || !g.drops.some((d) => d.i === i)) return;
    const hits = [...g.hits];
    hits[i] = hit;
    let ng: Game = {
      ...g,
      hits,
      cur: Math.max(g.cur, i + 1),
      drops: g.drops.filter((d) => d.i !== i),
      lives: hit ? g.lives : g.lives - 1,
      lastMiss: hit ? g.lastMiss : items[i].word,
    };
    // Never leave the sky empty waiting on the timer.
    if (ng.drops.length === 0) ng = spawn(ng, items.length);
    apply(ng);
  };

  const submit = (raw: string) => {
    const g = gref.current;
    const typed = norm(raw);
    if (!g || phase !== "playing" || typed === "") return;
    if (typed === norm(items[g.cur].word)) resolve(g.cur, true);
    else {
      // Shake in place. (Not a remount: that would drop focus, and with
      // it the phone keyboard.)
      inputRef.current?.animate(
        [
          { transform: "translateX(0)", borderColor: "var(--color-incorrect)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(0)", borderColor: "var(--color-incorrect)" },
        ],
        { duration: 300 },
      );
    }
  };

  const takeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    const value = el.value;
    el.value = "";
    // Several words can arrive at once (paste, fast typists, voice input).
    value.split(/\s+/).forEach(submit);
  };

  const shown = (word: string) => (level === 0 ? word : level === 1 ? hintWord(word, lang) : maskWord(word));

  const total = items.length;
  const cleared = game ? game.hits.filter(Boolean).length : 0;
  const currentVerse = game ? items[Math.min(game.cur, total - 1)].verse : null;

  return (
    <ModeShell mode="rain" focus={phase === "playing"} onExitFocus={() => setPhase("setup")}>
      {phase === "setup" && (
        <div className="memCard memSetup">
          <h2>{t("memory.pickVerse")}</h2>
          <VersePicker value={verse} onChange={setVerse} allowAll />
          <h2>{t("memory.rain.level")}</h2>
          <div className="memSeg" role="group" aria-label={t("memory.rain.level")}>
            {[0, 1, 2].map((l) => (
              <button key={l} type="button" className={level === l ? "isActive" : ""} aria-pressed={level === l} onClick={() => setLevel(l)}>
                {t(`memory.rain.level${l}`)}
              </button>
            ))}
          </div>
          <p className="memHint">{t(`memory.rain.level${level}.note`)}</p>
          <h2>{t("memory.rain.speed")}</h2>
          <div className="memSeg" role="group" aria-label={t("memory.rain.speed")}>
            {[0, 1, 2].map((s) => (
              <button key={s} type="button" className={speed === s ? "isActive" : ""} aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                {t(`memory.rain.speed${s}`)}
              </button>
            ))}
          </div>
          <button type="button" className="memButton memButton--primary memStart" onClick={start}>
            {t("memory.start")}
          </button>
        </div>
      )}

      {phase === "playing" && game && (
        <div className="memRain">
          <div className="memRainHud">
            <span className="memHearts" aria-label={t("memory.rain.lives", { n: game.lives })}>
              {"♥".repeat(game.lives)}
              <span className="memHeartsLost">{"♥".repeat(LIVES - game.lives)}</span>
            </span>
            <span>
              {cleared} / {total}
            </span>
          </div>
          <div className="memRainSky" onClick={() => inputRef.current?.focus()}>
            {game.drops.map((d) => (
              <span
                key={d.i}
                className={`memDrop${d.i === game.cur ? " isTarget" : ""}`}
                style={
                  {
                    left: `${d.x}%`,
                    "--x": `-${d.x}%`,
                    animationDuration: `${FALL_SECONDS[speed]}s`,
                  } as CSSProperties
                }
                onAnimationEnd={() => resolve(d.i, false)}
              >
                {shown(items[d.i].word)}
              </span>
            ))}
          </div>
          <p className="memRainBuilt" aria-live="polite">
            <span className="memRainBuiltRef">
              {passage.book} 1:{currentVerse}
            </span>{" "}
            {items.map((it, i) =>
              i < game.cur && it.verse === currentVerse ? (
                <span key={i} className={game.hits[i] ? "memHit" : "memMiss"}>
                  {it.word}{" "}
                </span>
              ) : null,
            )}
          </p>
          <input
            ref={inputRef}
            className="memRainInput"
            type="text"
            enterKeyHint="next"
            placeholder={t("memory.rain.inputPh")}
            aria-label={t("memory.rain.inputPh")}
            {...PLAIN_TEXT_FIELD}
            name="memory-next-word"
            // A space (which also commits a Korean syllable) or Enter
            // sends the word. If Enter lands while a syllable is still
            // being composed, wait for the IME to commit it first.
            onChange={(e) => {
              if (/\s$/.test(e.target.value)) takeInput();
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (e.nativeEvent.isComposing) enterPending.current = true;
              else takeInput();
            }}
            onCompositionEnd={() => {
              if (!enterPending.current) return;
              enterPending.current = false;
              takeInput();
            }}
          />
          {game.lastMiss && <p className="memHint">{t("memory.rain.missed", { word: game.lastMiss })}</p>}
        </div>
      )}

      {phase === "done" && game && (
        <div className="memCard memResult">
          <p className="memResultEmoji" aria-hidden="true">
            {game.lives > 0 ? "🌈" : "💧"}
          </p>
          <h2>{game.lives > 0 ? t("memory.rain.win") : t("memory.rain.over")}</h2>
          <p className="memResultScore">{Math.round((cleared / total) * 100)}%</p>
          <p>{t("memory.rain.cleared", { n: cleared, total })}</p>
          <div className="memActions">
            <button type="button" className="memButton memButton--primary" onClick={start}>
              {t("memory.retry")}
            </button>
            <button type="button" className="memButton" onClick={() => setPhase("setup")}>
              {t("memory.toSetup")}
            </button>
          </div>
        </div>
      )}
    </ModeShell>
  );
}
