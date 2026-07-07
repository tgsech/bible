# Data model + performance refactor

## How to integrate

1. Copy `src/bible-data/`, `src/hooks/`, and `src/components/` into your project's `src/`.
2. Replace your existing `src/App.tsx` with the one here (or merge — the JSX/CSS
   class names are unchanged from your original, so `index.css`/`App.css` need no edits).
3. You can delete `src/verseSample.ts` and `src/assets/engBib/gen.ts` once you've
   migrated any content you still want out of them into the new JSON format.

## Adding a chapter

Drop a new file at:

```
src/bible-data/translations/<translation-id>/books/<book-id>/<chapter-padded-2-digits>.json
```

containing `{ "verses": ["...", "..."] }`, and add its verse count to that
book's `versesPerChapter` array in the translation's `meta.ts`. That's it —
`import.meta.glob` in `loader.ts` picks it up automatically, no other code changes.

## Adding a whole book

Add a new folder under `books/` for that translation, plus a `BookMeta` entry
in `meta.ts`.

## Adding a whole translation (including a second Korean or English translation)

1. `src/bible-data/translations/<new-id>/meta.ts` + its `books/` folder.
2. Import that `meta` and add it to the `TRANSLATIONS` array in `App.tsx`.

Nothing else needs to change — this is also your future "choose a translation"
and "toggle KR/EN" features, since `TranslationMeta.language` already tags
which language each one is in.

## New in this pass: chapter nav + live WPM/accuracy

- `ChapterNav` renders Previous/Next buttons. `stepChapter()` in `App.tsx`
  handles rolling over into the next/previous book once a translation has
  more than one book — it already does the right thing, it just has nothing
  to roll into yet since only Genesis is populated in the sample data.
- `LiveStats` shows WPM and accuracy in the top-right corner, ticking every
  250ms while you're typing. It's its own component with its own local
  ticking state, so the 4x/second re-render it causes never touches
  `ChapterView` or the verse list — the performance work from the last pass
  still holds.
- Accuracy/WPM are driven by `correctKeystrokes`/`totalKeystrokes` in
  `useTypingSession`, scored two different ways depending on the script:
  - **English**: scored immediately per character in `handleInput`, since
    each keystroke is final the moment it lands.
  - **Korean (or any IME script)**: scored once per syllable, at
    `compositionend`, via `commitComposition`. This matters because Hangul
    composes in place (ㄱ → 가 → 간 all replace the same slot rather than
    appending), so grading it mid-composition would mark almost every
    syllable "wrong" before you'd even finished typing it.
- Backspacing is never penalized and never un-penalizes a prior mistake —
  only forward-typed/finalized characters are scored. This means accuracy
  reflects "how many keystrokes you got right the first time," not "what
  does the final text look like." Known cross-browser quirk: a few browsers
  order the final `input` event and `compositionend` event differently for
  IME text, which can very occasionally miss scoring the very last syllable
  of a composition — minor, but worth knowing about.

## New in this pass: Korean WPM, untypeable-character leniency, auto-scroll

- **`src/typing/koreanKeystrokes.ts`** decomposes each Hangul syllable into
  initial/medial/final jamo and counts real keystrokes (compound vowels like
  ㅘ and compound batchim like ㄳ cost 2 keys, matching standard 2-beolsik
  layout). `LiveStats` uses this to show Korean speed as 타/분
  (keystrokes/minute, the conventional metric) instead of English's WPM
  (`chars / 5`). Both share the same underlying `correctKeystrokes`/
  `totalKeystrokes` counters - only the display formula and label differ.

- **`src/typing/charMatch.ts`** is the single source of truth for "does this
  keystroke count as correct," used by the live stats, the verse coloring,
  and verse-completion detection alike. For non-Korean text: curly quotes
  (" " ' ') accept their plain equivalent, and any other non-ASCII character
  (em dashes, é/ñ/ü, ellipses, etc.) is a wildcard that accepts whatever was
  typed. Korean is explicitly excluded from the wildcard rule - since every
  Hangul syllable is non-ASCII, applying it there would make all Korean
  typing auto-pass, so `language` is threaded through everywhere this matters.

- **Auto-scroll**: `ChapterView` holds a ref to whichever verse row is
  currently active and calls `scrollIntoView({ block: "nearest" })` whenever
  `verseIndex` changes. That call is a no-op if the row's already visible
  and scrolls the minimum distance otherwise, which is exactly "page down
  once you hit the bottom" without any manual viewport math. `VerseRow` is
  now `forwardRef`-wrapped so the ref can attach directly to its root
  element without an extra wrapper `<div>`. The same pattern scrolls the
  nav buttons into view once a chapter is completed.

## What's NOT done here (left for the next milestones)

- `versesPerChapter` is only filled in for Genesis 1-2 in both sample
  translations — populating the rest of the Bible is a data-entry job, not
  a code change.
- WPM is still calculated with the English `chars / 5` convention. Korean
  needs its own formula (counting 자소/keystrokes, not characters) — that's
  part of the KR/EN engine split.
- Book-boundary wrapping on Enter/Shift+Enter is stubbed with a TODO since
  each translation's book list is still incomplete in this demo.
- No leaderboard/stats/theme work here — this pass is purely the data model
  + the render-performance fix (memoized `VerseRow`, only the active verse
  gets per-letter treatment).
