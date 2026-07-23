# Bible (frontend)

A typing-practice / reading app for the Bible — type or read chapters
verse-by-verse, tracked WPM (English) / 타수 (Korean keystrokes), streaks,
completions, and a public leaderboard. React + Vite, deployed as a
Cloudflare Worker (static assets).

Pairs with the [backend](../bible-backend) for accounts, progress, and the
leaderboard; works standalone for guests (progress kept in `localStorage`
until they sign in, then merged once).

## Local development

```bash
npm install
cp .env.example .env   # if present — VITE_API_URL, etc.
npm run dev
```

`npm run dev` and `npm run build` both regenerate `public/bible-meta.json`
first (see below) — nothing extra to remember when adding Bible content.

## Adding Bible content

Chapters live at:

```
src/bible-data/translations/<translation-id>/books/<book-id>/<chapter-padded-2-digits>.json
```

as `{ "verses": ["...", "..."] }`. `import.meta.glob` in `bible-data/loader.ts`
picks up new chapter files automatically — no other code changes needed to
make a chapter loadable.

- **New chapter**: drop the file, and extend that book's `versesPerChapter`
  array in the translation's `meta.ts` (drives chapter-count UI like the
  book/chapter dropdown).
- **New book**: new folder under `books/`, plus a `BookMeta` entry in
  `meta.ts`.
- **New translation**: `src/bible-data/translations/<new-id>/meta.ts` + its
  `books/` folder, then add it to the `TRANSLATIONS` array wherever a page
  imports one (currently `LandingPage.tsx` and `ProfilePage.tsx` — search
  for `TRANSLATIONS` if that list grows).

### `bible-meta.json`

`scripts/generate-bible-meta.mjs` counts the actual chapter files on disk
per translation and writes `public/bible-meta.json` — total chapter counts,
nothing else. It runs automatically before `dev`/`build` (`predev`/
`prebuild` in `package.json`), and isn't committed to git since it's fully
derived.

This exists because the backend's "finished the whole Bible" leaderboard
board needs to know how many chapters a translation actually has, and it
has no other access to this repo's content — it fetches this file from the
deployed frontend at runtime instead of keeping its own hand-typed copy
(see the backend's `src/lib/bible-totals.ts`). If you're testing that board
against a local backend, make sure the backend's `FRONTEND_URL` points
somewhere that's actually serving an up-to-date `bible-meta.json` (a deploy
preview, or `vite preview` after a build).

## Structure

- `src/bible-data/` — chapter content + translation metadata + the loader
- `src/typing/` — typing-accuracy scoring, WPM/타수 formulas, Korean
  keystroke decomposition (`koreanKeystrokes.ts`)
- `src/theme/` — palette/font options + `ThemeContext`, which writes
  `--color-*`/`--font-body` CSS custom properties onto `:root`; every themed
  component reads those variables rather than hardcoding colors/fonts.
  Persisted to `localStorage` for everyone, and synced to the backend
  (`/profile/settings`) for logged-in users so it follows them across
  devices.
- `src/hooks/` — `useTypingSession` (the typing engine's state machine),
  `useProgress`/`useReadingProgress` (save/restore position), `useChapter`,
  `useReadMode` (typing vs. read-only toggle)
- `src/components/` — reusable UI: chapter view, verse rows, chapter nav,
  completion modal, theme pickers, profile settings form
- `src/pages/` — routed pages (`react-router-dom`): landing, read, profile,
  leaderboard, about, auth
- `src/lib/api.ts` — thin fetch wrapper for the backend; `authClient.ts` —
  Better Auth client

## Known data limitations

`src/bible-data` currently only has a handful of chapters populated (a
couple of Genesis chapters in both translations, plus a few Psalms/
Ecclesiastes chapters in `krv-ko`) — enough to exercise every code path, not
a complete Bible yet. Filling in the rest is a data-entry job, not a code
change; nothing in the app assumes more than what's actually present.

## Deploying

```bash
npm run build     # regenerates bible-meta.json, then tsc -b && vite build
npx wrangler deploy
```
