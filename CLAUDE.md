# Finish Line

Single-player browser game that rewards finishing initiatives and difficult conversations. The full spec is `PLAN.md`; its game rules are the spec the engine must enforce exactly.

## Working rules

- Build phase by phase as in `PLAN.md`. After each phase: run tests, run the app, summarise what works, then stop and wait for the go.
- Write engine tests before the UI for each phase.
- If the plan is ambiguous, ask instead of guessing.

## Architecture rules

- `src/engine/` is pure TypeScript: no React, no browser APIs, no `Date.now()` / `new Date()` without an argument, no `Math.random()`. Time (`now: Date`) and ids are always passed in.
- Every game action is a function `(state, payload, now) => newState` in `src/engine/actions.ts`, dispatched by `applyAction`. Never mutate the input state.
- Rule violations throw `GameRuleError` (`src/engine/errors.ts`) with a typed `code` and a player-facing `message`.
- All XP values, limits and thresholds live only in `src/engine/config.ts`.
- XP is never stored. It is derived from `state.events` (`src/engine/scoring.ts`), so rules can be re-tuned and replayed.
- Weeks are ISO weeks (Monday start) in Europe/Zurich; use the helpers in `src/engine/weeks.ts`.
- `GameState` has a `schemaVersion`; any change to the stored shape needs a migration step in `src/engine/migrate.ts` and a test.
- The store (`src/store/`) only calls engine functions; components never change state directly.
- The app makes no network requests after loading. Player data stays in localStorage.

## Commands

- `npm test` — engine unit tests (Vitest)
- `npm run coverage` — tests + coverage; `src/engine/` must stay at ≥ 90%
- `npm run dev` — local dev server at http://localhost:5173/finishline/
- `npm run build` — typecheck + production build to `dist/`

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` on push to `main`; failing tests block the deploy. Vite `base` is `/finishline/` (the repo name).
