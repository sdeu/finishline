# Finish Line — Implementation Plan

Nov 24, 2026 · @Steffen

## Overview

Finish Line is a single-player browser game that rewards finishing initiatives and having uncomfortable conversations, not starting new work. It is for one user (Steffen, Head of Software), runs fully in the browser, and keeps all data locally.

The game combines three ideas: hard limits on work in progress (*Making Work Visible*, *Essentialism*), weekly lead measures on a visible scoreboard (*The 4 Disciplines of Execution*), and deliberate practice of difficult conversations (*Crucial Conversations*, *Radical Candor*).

**v1 scope**

- Two quest slots plus a Vault for parked ideas
- Bosses (definition of done), finishing and killing quests
- Weekly lead actions, Courage cards, XP, levels and self-chosen rewards
- Friday save point (weekly review) with a streak
- Achievements
- Local persistence with JSON export and import; installable PWA hosted on GitHub Pages

**Out of v1:** accounts, sync between devices, a backend, notifications, multiplayer and integrations with Jira or calendars.

## Game rules

These rules are the spec. The engine must enforce them exactly; all numbers live in one config file so they can be tuned later.

**Quests and the Vault**

1. A quest is an initiative. Each quest has a title, a **boss** (one sentence defining done) and an optional deadline.
2. At most **2 quests are active**. Everything else sits in the **Vault** (backlog). The Vault is unlimited.
3. A quest cannot be activated without a boss. The UI blocks activation until the field is filled.
4. To activate a third quest, the player must first **finish** or **kill** an active one.
5. **Emergency override:** the player may force a third active quest. This resets the streak to 0 and is logged.
6. **Finish** = boss defeated. The player confirms the boss sentence is true. No partial credit.
7. **Kill** = deliberate stop. Requires a short reason and a checkbox "I told the people involved."
8. **Drifting:** an active quest with no completed lead action for 14 days is marked drifting and costs a one-time penalty.

**Scoring**

| Event | XP | Notes |
| --- | --- | --- |
| Lead action completed | 10 | Belongs to an active quest |
| Boss defeated (quest finished) | 100 |  |
| Quest killed cleanly | 30 | Reason + "told people" required |
| Quest drifting | −20 | Once per drift episode |
| Courage card, common | 5 | Ask for a date or commitment, follow up on a missed one |
| Courage card, rare | 15 | Say no, or disagree openly |
| Courage card, epic | 40 | Prepared difficult conversation |
| Save point completed | 20 | Weekly review, Friday to Sunday |

- **×2 Public commitment:** a quest flagged "public" (deadline told to team or manager) doubles its lead action and boss XP.
- **Busywork earns nothing.** Lead actions must belong to a quest; there is no free-form task XP.
- XP total never drops below 0.

**Weekly loop**

- **Monday plan:** pick 2–3 lead actions for the active quests for this week.
- **During the week:** tick off lead actions and log Courage cards. Weekly target: 3 Courage cards.
- **Save point:** a 30-minute review between Friday and Sunday. Score the week, note one lesson, plan next week's lead actions.
- **Streak** = consecutive weeks with a completed save point. A missed week or an emergency override resets it to 0.
- Weeks are ISO weeks (Monday start) in the Europe/Zurich time zone.

**Levels and rewards**

- One level per 300 XP.
- The player defines a reward for each upcoming level in advance. Reaching the level shows a "claim reward" moment.

**Achievements**

| Achievement | Condition |
| --- | --- |
| Closer | First boss defeated |
| The Knife | First quest killed cleanly |
| No Is a Complete Sentence | 5 rare Courage cards tagged "said no" |
| Disagree & Commit | Rare card tagged "disagreed" plus a finished quest it was linked to |
| Clean Slate | 4 weeks in a row without an emergency override |
| Iron Streak | Streak of 8 weeks |
| Brave Week | 3 or more Courage cards in a single week |

## Tech stack and architecture

A static single-page app with no backend: a pure TypeScript game engine, a thin React UI on top, and state saved in localStorage.

| Concern | Choice | Why |
| --- | --- | --- |
| Build | Vite + TypeScript (strict) | Fast, zero config, static output |
| UI | React 18 | Simple component model |
| Styling | Tailwind CSS | Quick, consistent game look |
| State | Zustand with `persist` middleware | Small; saves to localStorage automatically |
| Dates | date-fns + date-fns-tz | ISO weeks in Europe/Zurich |
| Tests | Vitest (+ React Testing Library for key screens) | Same toolchain as Vite |
| Effects | canvas-confetti | Celebration on boss defeat and level-up |
| Offline / phone | vite-plugin-pwa (phase 2) | Install on phone and laptop, works offline |
| Hosting | GitHub Pages, deployed by GitHub Actions | Free static hosting over https, which a PWA requires |

**Architecture rules**

- `src/engine/` is pure TypeScript with no React or browser APIs. Every game action is a function `(state, action, now) => newState`, plus derived selectors. This makes the rules fully unit-testable.
- The store only calls engine functions; components never change state directly.
- All XP values and thresholds live in `src/engine/config.ts`.
- Time is always passed in (`now`), never read inside the engine, so tests can simulate weeks.
- State has a `schemaVersion` and a migration function from day one.

**Folder structure**

```
finish-line/
  src/
    engine/
      config.ts        # XP values, limits, thresholds
      types.ts         # data model
      actions.ts       # reducers: activateQuest, finishQuest, killQuest, logCourage, ...
      scoring.ts       # XP, multipliers, levels
      weeks.ts         # ISO week helpers, streak, drift detection
      achievements.ts  # achievement rules
      migrate.ts       # schema migrations
    store/
      useGame.ts       # Zustand store + persist
    ui/
      screens/         # Dashboard, Vault, QuestDetail, Courage, SavePoint, Trophies, Settings
      components/      # QuestSlot, XpBar, StreakFlame, CourageCard, AchievementBadge, Modal
    App.tsx
    main.tsx
  tests/               # engine unit tests
```

**Deployment (GitHub Pages)**

- Repo: `finish-line` on the user's GitHub account. The site URL will be `https://<user>.github.io/finish-line/`.
- Set `base: '/finish-line/'` in `vite.config.ts`, and use the same path for the PWA manifest `start_url` and `scope`.
- Workflow `.github/workflows/deploy.yml`: on push to `main`, run `npm ci`, `npm test`, `npm run build`, then publish `dist/` with `actions/upload-pages-artifact` and `actions/deploy-pages`. A failing test blocks the deploy.
- PWA: `vite-plugin-pwa` with `registerType: 'autoUpdate'`, app name "Finish Line", icons 192 and 512 px, theme colour from the game palette, all assets precached for offline use.
- Add `<meta name="robots" content="noindex">` so search engines don't list the page.
- **Privacy model:** the hosted site contains only the empty game. All player data stays in the browser's localStorage on each device and is never sent anywhere. The app makes no network requests after loading.
- Each device has its own save; moving between devices works through JSON export and import.

## Data model

The whole game is one serialisable `GameState` object. XP is never stored as a running number; it is derived from the event log, so rules can be re-tuned and replayed.

```ts
type ISODate = string;  // '2026-11-24T20:46:00+01:00'
type WeekKey = string;  // '2026-W48'

type QuestStatus = 'vault' | 'active' | 'finished' | 'killed';

interface Quest {
  id: string;
  title: string;
  boss: string;              // definition of done, required to activate
  deadline?: ISODate;
  isPublic: boolean;         // x2 multiplier
  status: QuestStatus;
  createdAt: ISODate;
  activatedAt?: ISODate;
  closedAt?: ISODate;
  killReason?: string;
  notes?: string;
}

interface LeadAction {
  id: string;
  questId: string;
  week: WeekKey;
  text: string;
  doneAt?: ISODate;
}

type CourageRarity = 'common' | 'rare' | 'epic';
type CourageTag = 'asked-commitment' | 'followed-up' | 'said-no' | 'disagreed' | 'difficult-talk' | 'other';

interface CourageCard {
  id: string;
  rarity: CourageRarity;
  tag: CourageTag;
  note: string;              // what happened, one line
  questId?: string;          // optional link to a quest
  at: ISODate;
}

interface SavePoint {
  week: WeekKey;
  completedAt: ISODate;
  lesson: string;
  wins: string;
}

interface LevelReward { level: number; reward: string; claimedAt?: ISODate; }

type GameEvent =
  | { type: 'LEAD_ACTION_DONE'; at: ISODate; leadActionId: string; questId: string }
  | { type: 'BOSS_DEFEATED'; at: ISODate; questId: string }
  | { type: 'QUEST_KILLED'; at: ISODate; questId: string }
  | { type: 'QUEST_DRIFTED'; at: ISODate; questId: string }
  | { type: 'COURAGE_LOGGED'; at: ISODate; cardId: string; rarity: CourageRarity }
  | { type: 'SAVE_POINT'; at: ISODate; week: WeekKey }
  | { type: 'OVERRIDE_USED'; at: ISODate; questId: string }
  | { type: 'STREAK_RESET'; at: ISODate; reason: 'missed-week' | 'override' };

interface GameState {
  schemaVersion: 1;
  quests: Quest[];
  leadActions: LeadAction[];
  courageCards: CourageCard[];
  savePoints: SavePoint[];
  rewards: LevelReward[];
  events: GameEvent[];       // append-only log, source of XP
  unlockedAchievements: { id: string; at: ISODate }[];
  settings: { timezone: 'Europe/Zurich'; weeklyCourageTarget: number };
}
```

Derived (never stored): total XP, level, progress to next level, current streak, this week's Courage count, drifting quests.

## Screens and flows

The dashboard is the scoreboard: everything important is visible on one screen in under 5 seconds, on a laptop and on a phone.

| Screen | Shows | Main actions |
| --- | --- | --- |
| Dashboard | Two quest slots (boss, deadline, this week's lead actions), XP bar with level, streak flame, Courage cards this week vs target, drifting warnings | Tick lead action, log Courage card, open quest |
| Vault | Parked quests, sortable | Add idea, edit, activate (blocked if slots full) |
| Quest detail | Boss, notes, lead action history, linked Courage cards, public flag | Defeat boss, kill quest, edit |
| Courage log | All cards as a card collection, rarity colours, weekly counts | Log new card (rarity, tag, one-line note) |
| Save point | Guided weekly review | Score the week, write lesson, plan next week's lead actions |
| Trophies | Achievements (locked and unlocked), level history, rewards | Define reward for next level, claim reward |
| Settings | Weekly Courage target, data | Export JSON, import JSON, reset game |

**Key flows**

1. **Activate a quest:** Vault → Activate → if a slot is free, require the boss and offer the public flag. If both slots are full, show "Finish or kill a quest first" with two buttons, plus a small "Emergency override" link that warns about losing the streak.
2. **Defeat the boss:** Quest detail → Defeat boss → show the boss sentence and ask "Is this true now?" → confetti, +100 XP (or +200 if public), slot frees, check achievements.
3. **Kill a quest:** Quest detail → Kill → require a reason and the "I told the people involved" checkbox → +30 XP.
4. **Log a Courage card:** one tap from the dashboard → pick rarity and tag → one-line note → card flip animation.
5. **Save point:** available Friday to Sunday; a dashboard banner appears on Friday. Steps: (a) week summary with XP earned and cards played, (b) one lesson learned, (c) plan 2–3 lead actions for next week → +20 XP, streak +1.
6. **Monday:** if no lead actions are planned for the current week, the dashboard asks for them before anything else.

**Look and feel**

- Light game feel, not childish: card-like quest slots, a glowing XP bar, a flame for the streak.
- Rarity colours: common green, rare blue, epic purple.
- Empty slots look inviting; a full board looks "locked" to discourage a third quest.
- Responsive: a single column on phone widths.

## Engine logic

All rules below are pure functions in `src/engine/`, each covered by unit tests.

**XP calculation** (`scoring.ts`)

- `totalXp(state)` = the sum over `events` of the XP per event type from `config.ts`, with the ×2 multiplier for `LEAD_ACTION_DONE` and `BOSS_DEFEATED` when the quest's `isPublic` is true. Clamp at 0.
- `level(xp)` = `floor(xp / 300) + 1`; `progress(xp)` = `(xp % 300) / 300`.
- Undoing a ticked lead action removes its event (undo window: same day only).

**Guards** (`actions.ts`, each throws a typed `GameRuleError` that the UI shows)

- `activateQuest`: boss must be non-empty; active count must be < 2 unless `override: true`.
- `override: true` appends `OVERRIDE_USED` and `STREAK_RESET`.
- `finishQuest` / `killQuest`: quest must be active; kill requires `reason` and `toldPeople === true`.
- `addLeadAction`: quest must be active; at most 3 lead actions per quest per week.

**Weeks and streak** (`weeks.ts`)

- `weekKey(now)` = ISO week in Europe/Zurich.
- Save point allowed when the local weekday is Friday, Saturday or Sunday, once per week.
- `currentStreak(state, now)` = count consecutive weeks backwards from the last completed week that have a save point, stopping at the first gap or at an override event in that week. The current week counts only once its save point is done.

**Drift detection** (`weeks.ts`, run on app open via `tick(state, now)`)

- For each active quest: last activity = latest of `activatedAt` and its last completed lead action.
- If `now − lastActivity ≥ 14 days` and no `QUEST_DRIFTED` event since that last activity → append `QUEST_DRIFTED` (−20 XP) and show a warning.

**Achievements** (`achievements.ts`)

- Each achievement is `{ id, title, description, check(state, now): boolean }`.
- After every action, `evaluateAchievements` runs all checks and records newly true ones with a timestamp. Unlocked achievements never re-lock.

**`tick(state, now)`** runs on app start and every hour while open: drift detection, streak reset for a missed week, achievement checks.

## Milestones

Five phases, built in order. Each phase ends with a playable app and green tests; stop and demo after each phase.

1. **Phase 1: Engine core and pipeline**
   - Scaffold Vite + React + TS + Tailwind + Vitest, with `base: '/finish-line/'`.
   - Implement `types.ts`, `config.ts`, `actions.ts`, `scoring.ts` for quests, Vault, boss, finish, kill and lead actions.
   - Set up the GitHub Actions workflow that tests, builds and deploys to GitHub Pages.
   - Done when: unit tests cover the 2-slot limit, boss requirement, override, finish and kill XP, the public ×2 multiplier and the XP floor at 0, and a placeholder page is live on GitHub Pages.
2. **Phase 2: Playable dashboard as a PWA**
   - Zustand store with localStorage persistence.
   - Dashboard with two quest slots and XP bar, the Vault screen, quest detail with finish and kill flows.
   - PWA manifest, icons, service worker; responsive single-column layout for phones.
   - Done when: a quest can go Vault → active → finished across a page reload with correct XP, a third activation is blocked in the UI, and the app installs on iPhone/Android and opens offline.
3. **Phase 3: Courage and weekly loop**
   - Courage log and quick-log from the dashboard, weekly target counter.
   - `weeks.ts`: week keys, save point flow, streak, Monday planning prompt, drift detection via `tick`.
   - Done when: tests with simulated dates (fixed `now`) prove streak growth, reset on a missed week and on override, and a single drift penalty after 14 idle days.
4. **Phase 4: Levels, rewards, achievements**
   - Level-up moment with confetti, reward definition and claiming, Trophies screen, all 7 achievements.
   - Done when: each achievement has a unit test that unlocks it, and level-up shows the predefined reward.
5. **Phase 5: Polish and portability**
   - JSON export and import with schema validation (zod), reset with confirmation, empty states, keyboard shortcuts on desktop, an "export reminder" if the last backup is older than 30 days.
   - Done when: export → reset → import restores an identical state, including between phone and laptop.

## Testing

The engine carries the rules, so it carries most of the tests; the UI gets a few smoke tests.

- **Engine unit tests (Vitest):** every guard, every XP event, the multiplier, level thresholds (299, 300, 301 XP), every achievement.
- **Time-travel tests:** a helper `simulateWeeks(state, plan)` that steps `now` through several weeks to test streaks, missed weeks, drift and Friday-to-Sunday save point windows, including the change from summer to winter time in Europe/Zurich.
- **Persistence tests:** state survives a reload; an old `schemaVersion` migrates correctly; malformed import JSON is rejected without touching current data.
- **UI smoke tests (React Testing Library):** activate a quest, tick a lead action, defeat the boss, log a Courage card, complete a save point.
- **Coverage target:** 90% or more on `src/engine/`.

## Handoff to Claude Code

Export this doc as Markdown, save it as `PLAN.md` in an empty repo, and start Claude Code with the prompt below.

```
Read PLAN.md. Build Finish Line phase by phase, exactly as specified.
Rules:
- Keep src/engine pure (no React, no Date.now(); time is passed in).
- All XP values and limits only in src/engine/config.ts.
- Write the engine tests before the UI for each phase.
- After each phase: run tests, run the app, summarise what works, then stop and wait for my go.
- If the plan is ambiguous, ask instead of guessing.
Start with Phase 1.
```

**Also create a `CLAUDE.md`** in the repo with the architecture rules from this plan, so every later session follows them.

**Open decisions** (defaults chosen; change before Phase 1 if you disagree)

- [ ] Undo window for ticked lead actions: same day only?
- [ ] Max 3 lead actions per quest per week, or per week overall?
- [ ] Should killing a quest without telling anyone be allowed at 0 XP, or blocked?
- [ ] Language of the UI: English or German?
- [ ] Public repo, or private repo with GitHub Pro (the site is public either way)?
