import { describe, expect, it } from 'vitest';
import { eventXp, levelFor, levelProgress, totalXp, xpIntoLevel, xpToNextLevel } from '../src/engine/scoring';
import { createInitialState } from '../src/engine/migrate';
import type { GameEvent, GameState } from '../src/engine/types';
import { NOW, activeQuest, play } from './helpers';

const t = NOW.toISOString();
const withEvents = (events: GameEvent[], base: GameState = createInitialState()): GameState => ({ ...base, events });

describe('XP per event', () => {
  const s = play(activeQuest('q1'));
  it.each<[GameEvent, number]>([
    [{ type: 'LEAD_ACTION_DONE', at: t, leadActionId: 'l', questId: 'q1' }, 10],
    [{ type: 'BOSS_DEFEATED', at: t, questId: 'q1' }, 100],
    [{ type: 'QUEST_KILLED', at: t, questId: 'q1' }, 30],
    [{ type: 'QUEST_DRIFTED', at: t, questId: 'q1' }, -20],
    [{ type: 'COURAGE_LOGGED', at: t, cardId: 'c', rarity: 'common' }, 5],
    [{ type: 'COURAGE_LOGGED', at: t, cardId: 'c', rarity: 'rare' }, 15],
    [{ type: 'COURAGE_LOGGED', at: t, cardId: 'c', rarity: 'epic' }, 40],
    [{ type: 'SAVE_POINT', at: t, week: '2026-W48' }, 20],
    [{ type: 'OVERRIDE_USED', at: t, questId: 'q1' }, 0],
    [{ type: 'STREAK_RESET', at: t, reason: 'override' }, 0],
  ])('%o is worth %i', (event, xp) => {
    expect(eventXp(s, event)).toBe(xp);
  });
});

describe('public commitment x2', () => {
  const pub = play(activeQuest('q1', { isPublic: true }));
  it('doubles lead action and boss XP', () => {
    expect(eventXp(pub, { type: 'LEAD_ACTION_DONE', at: t, leadActionId: 'l', questId: 'q1' })).toBe(20);
    expect(eventXp(pub, { type: 'BOSS_DEFEATED', at: t, questId: 'q1' })).toBe(200);
  });
  it('does not double kill or drift', () => {
    expect(eventXp(pub, { type: 'QUEST_KILLED', at: t, questId: 'q1' })).toBe(30);
    expect(eventXp(pub, { type: 'QUEST_DRIFTED', at: t, questId: 'q1' })).toBe(-20);
  });
  it('end to end: a public quest finished with one lead action is worth 220', () => {
    const s = play([
      ...activeQuest('q1', { isPublic: true }),
      { type: 'addLeadAction', id: 'l1', questId: 'q1', text: 'x' },
      { type: 'completeLeadAction', leadActionId: 'l1' },
      { type: 'finishQuest', questId: 'q1' },
    ]);
    expect(totalXp(s)).toBe(220);
  });
});

describe('totalXp', () => {
  it('is 0 for a new game', () => {
    expect(totalXp(createInitialState())).toBe(0);
  });

  it('sums finish and kill XP', () => {
    const s = play([
      ...activeQuest('q1'),
      ...activeQuest('q2'),
      { type: 'finishQuest', questId: 'q1' },
      { type: 'killQuest', questId: 'q2', reason: 'r', toldPeople: true },
    ]);
    expect(totalXp(s)).toBe(130);
  });

  it('never drops below 0', () => {
    const drift: GameEvent = { type: 'QUEST_DRIFTED', at: t, questId: 'q1' };
    expect(totalXp(withEvents([drift]))).toBe(0);
    expect(totalXp(withEvents([drift, drift, { type: 'SAVE_POINT', at: t, week: '2026-W48' }]))).toBe(0);
    expect(totalXp(withEvents([{ type: 'SAVE_POINT', at: t, week: '2026-W48' }, drift]))).toBe(0);
  });

  it('busywork earns nothing: unticked lead actions and overrides give 0', () => {
    const s = play([
      ...activeQuest('q1'),
      ...activeQuest('q2'),
      { type: 'createQuest', id: 'q3', title: 'T', boss: 'B' },
      { type: 'activateQuest', questId: 'q3', override: true },
      { type: 'addLeadAction', id: 'l1', questId: 'q1', text: 'x' },
    ]);
    expect(totalXp(s)).toBe(0);
  });
});

describe('levels', () => {
  it.each([
    [0, 1, 0],
    [299, 1, 299 / 300],
    [300, 2, 0],
    [301, 2, 1 / 300],
    [900, 4, 0],
  ])('%i XP → level %i, progress %f', (xp, level, progress) => {
    expect(levelFor(xp)).toBe(level);
    expect(levelProgress(xp)).toBeCloseTo(progress);
  });

  it('reports XP into and to the next level', () => {
    expect(xpIntoLevel(301)).toBe(1);
    expect(xpToNextLevel(301)).toBe(299);
    expect(xpToNextLevel(300)).toBe(300);
  });

  it('treats negative input as 0', () => {
    expect(levelFor(-50)).toBe(1);
    expect(levelProgress(-50)).toBe(0);
  });
});
