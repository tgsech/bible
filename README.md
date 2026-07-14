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

## New in this pass: completion modal

- **`src/typing/stats.ts`** pulls the WPM/타수 + accuracy formula out of
  `LiveStats` into `computeTypingStats()`, so the live corner display and
  the completion modal's final numbers are guaranteed to agree - one
  formula, two call sites, rather than a second copy that could quietly
  drift out of sync.
- **`CompletionModal`** shows when the last verse of a chapter is typed
  correctly: a dimmed full-screen overlay, a card that pops in with a
  slight overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)` - the "satisfying"
  bounce), the final WPM/타수 + accuracy for that chapter, and a localized
  message ("Done!" / "수고했어요!") based on the translation's language.
  The continue button advances to the next chapter if one exists, or just
  closes the modal if this was the last available chapter (there's nothing
  to advance into yet since only Genesis is populated).
- **`extras?: ReactNode` prop** on `CompletionModal` is intentionally unused
  for now - it's the slot where a badge-earned indicator, a streak counter,
  or a share button can be dropped in later without touching the modal's
  layout, animation, or overlay logic.
- Everything here is theme-variable driven (`--color-bg`, `--color-text`),
  so it inherits from whatever the future theme picker sets.

## New in this pass: dropdown redesign + theme foundation

- **`BookMeta.group`** (e.g. "Old Testament" / "구약성경") drives `<optgroup>`
  sections in the book dropdown, so it stays navigable once all 66 books are
  populated instead of one flat list.
- **`BookChapterSelector`** got its own CSS file: labeled fields, consistent
  gaps, normalized `1.1rem` select sizing (was `2rem`, inherited from a
  shared `.bookSelect` class not built for long book names).
- **Fixed a real bug** in the process: the chapter heading and old dropdown
  always appended Korean "장" regardless of language, so English chapters
  were rendering "Genesis 1장". Now conditional on `translation.language`.
- **Theme foundation**: `index.css` now defines `--color-bg`, `--color-text`,
  `--color-untyped`, `--color-correct`, `--color-incorrect`,
  `--color-composing`, `--color-cursor`, and `--font-body` as CSS custom
  properties, and every component (including `VerseRow`'s inline per-letter
  coloring) references them instead of hardcoded hex/font values. **This
  file replaces your existing `src/index.css`.** A future theme switcher
  becomes a matter of swapping these variable values (e.g. via a
  `data-theme` attribute or writing to `document.documentElement.style`) -
  no component changes needed when that milestone comes up.

## Roadmap (captured, not yet built)

Everything below was raised as future work. Grouping it here so it isn't
lost, and so the dependencies between items are visible before any of it
gets built:

**Backend/account cluster** - these five all read/write against the same
handful of tables once an account system exists, so they're worth designing
as one schema rather than building local-storage versions piecemeal and
migrating later:
- `progress`: saved current spot per user (translationId/bookId/chapter/verseIndex) -
  logged-out fallback via localStorage.
- `saved_verses`: bookmarked verses per user.
- Analytics dashboard: most frequent mistakes, average WPM/타수, books/chapters
  completed, per-chapter progress - aggregates over the same
  `correctKeystrokes`/mistakes data `useTypingSession` already tracks, just
  needs a place to log completions.
- `verse_sets` + `set_completions`: named collections ("Love Set", "Faith
  Set") of book/chapter/verse ranges, plus which sets a user's completed -
  needed for badges.
- Leaderboard: rankings among logged-in users only, by WPM/타수/books
  completed/badges - reads off the same accounts + progress tables.
- Public profile pages (showcase badges, saved verses) - same account system,
  a public-read view over the above.

**Frontend-only, no backend needed:**
- Completion animation when the last verse of a chapter is typed correctly.
- Theme sets (font/background/text/error color bundles) - foundation is in
  place as of this pass; building the actual picker UI + a few named bundles
  is the remaining work.



## New in this pass: completion animation

- **`src/typing/stats.ts`** holds `computeTypingStats`, the exact same
  speed/accuracy formula `LiveStats` uses for its live ticking display -
  factored out so the completion modal shows the *identical* final number,
  not a second copy of the math that could quietly drift.
- **`CompletionModal`** shows on chapter completion: a dimmed full-screen
  overlay, a pop-in card (scale + fade, spring easing) with final
  speed/accuracy and a language-appropriate message ("Done!" / "수고했어요!"),
  and a single continue button that either advances to the next chapter or
  closes the modal if this was the last chapter in the translation.
- It takes an `extras` slot (currently unused) reserved for whatever comes
  next in the roadmap - a badge earned this session, a streak counter, a
  share button - without needing to touch the modal's layout or animation
  when that lands.
- Dismissing and re-triggering is tracked with a `modalDismissed` flag in
  `App.tsx` that resets whenever the chapter/book/translation changes, so
  advancing via the modal's own continue button naturally shows a fresh
  modal on the next chapter's completion.

## New in this pass: feedback fixes

- **Enter no longer jumps chapters.** Feedback was that this was
  unintuitive. `handleKeyDown`/`onKeyDown` were removed entirely from the
  hidden input, so Enter now does whatever a plain, form-less `<input>`
  does by default - nothing. Chapter navigation is exclusively the
  `ChapterNav` buttons and the completion modal's continue button now.
- **Pasting is blocked.** `onPaste={(e) => e.preventDefault()}` on the
  hidden input. Copying, selecting text, and everything else about normal
  input behavior is untouched - this only intercepts the paste event
  itself, so it also catches right-click "Paste" and middle-click paste,
  not just Ctrl/Cmd+V.
- **Mistyped spaces are now visible.** A space glyph has no ink, so coloring
  it "incorrect" was invisible - you could type the wrong character over a
  space and never see feedback. `VerseRow` now adds a small underline
  (`border-bottom`, themed via `--color-incorrect`) under a space
  specifically when it's been mistyped, and only then - correct spaces and
  every other character are unaffected.

## What's still outstanding

- `versesPerChapter` is only filled in for Genesis 1-2 in both sample
  translations — populating the rest of the Bible is a data-entry job, not
  a code change.
- Book-boundary wrapping on Enter/Shift+Enter/nav-buttons works, but only
  Genesis exists in the sample data, so there's nothing to roll into yet.
- No backend/leaderboard/analytics/badges here — see the Roadmap section
  above for what those need.
