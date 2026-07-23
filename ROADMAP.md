# Roadmap

Tracks the feature roadmap in dependency-ordered phases. Updated as things
land — check here before assuming something is or isn't built yet.

## Phase 1 — data model fixes ✅ done

- [x] Split WPM vs 타/분 tracking (`chapter_completions.unit`)
- [x] `username` / `bio` / `mood` fields on profile
- [x] Reading-progress table, separate from typing-progress

## Phase 2 — profile-facing features

- [x] **Read-only mode toggle** — `useReadMode`, saves to its own
      `reading_progress` table (separate "currently reading" vs "currently
      typing" position)
- [x] **Theme/font persistence** — saved to `localStorage` for everyone;
      synced to the backend (`user_profile.theme_id` / `.font_id`) for
      logged-in users so it follows them across devices
- [ ] Translation dropdown + per-book completion bars → chapter picker →
      resume mid-chapter

## Phase 3 — social/public features

- [x] **Public profile page** (`/u/:username`) — username, bio, mood, avg
      WPM/CPM, streak, badges. **Bookmarks are intentionally not shown yet**
      — see below.
- [ ] Verse bookmarking + public/private toggle. `saved_verses` exists but
      has no visibility column yet — needed before bookmarks can appear on
      a public profile or directory card.
- [ ] User directory (cards: display name, a couple of public bookmarks,
      badges) — blocked on the bookmark visibility toggle above.
- [ ] Comments on chapters — backend route (`/api/comments`) exists; no
      frontend UI yet.

## Phase 4 — leaderboard expansion ✅ done

- [x] Multiple boards: streak, chapters completed, total completions
      (repeats), full Bible read-throughs, WPM, CPM
- [x] Username-or-signup-name display, resolved once in SQL
- [x] "Finished the whole Bible" totals sourced from the frontend's actual
      chapter files (`scripts/generate-bible-meta.mjs` →
      `public/bible-meta.json`), not a hand-kept number — see that repo's
      README and the backend's `src/lib/bible-totals.ts`

## Phase 5 — i18n

- [ ] Site-language toggle (UI strings — "Sign in", prompts, etc.) —
      separate from Bible translation, which stays untouched
