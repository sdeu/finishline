import { describe, expect, it } from 'vitest';
import {
  closedQuests,
  freeSlots,
  leadActionsFor,
  questXp,
  scoreboard,
  slotsFull,
  sortVault,
  vaultQuests,
} from '../src/engine/selectors';
import { createInitialState } from '../src/engine/migrate';
import { NOW, activeQuest, at, play, vaultQuest } from './helpers';

describe('slots', () => {
  it('counts free slots', () => {
    expect(freeSlots(createInitialState())).toBe(2);
    expect(freeSlots(play(activeQuest('q1')))).toBe(1);
    const full = play([...activeQuest('q1'), ...activeQuest('q2')]);
    expect(freeSlots(full)).toBe(0);
    expect(slotsFull(full)).toBe(true);
    expect(slotsFull(play(activeQuest('q1')))).toBe(false);
  });

  it('never reports negative free slots after an override', () => {
    const s = play([...activeQuest('q1'), ...activeQuest('q2'), vaultQuest('q3'), { type: 'activateQuest', questId: 'q3', override: true }]);
    expect(freeSlots(s)).toBe(0);
  });
});

describe('quest lists', () => {
  const s = play([
    ...activeQuest('a'),
    ...activeQuest('b'),
    vaultQuest('v'),
    { type: 'finishQuest', questId: 'a' },
    { type: 'killQuest', questId: 'b', reason: 'r', toldPeople: true },
  ]);

  it('splits Vault and closed quests', () => {
    expect(vaultQuests(s).map((q) => q.id)).toEqual(['v']);
    expect(closedQuests(s).map((q) => q.id).sort()).toEqual(['a', 'b']);
  });

  it('lists closed quests newest first', () => {
    const t = play(
      [{ type: 'killQuest', questId: 'b', reason: 'r', toldPeople: true }],
      at('2026-11-26T10:00:00Z'),
      play([...activeQuest('a'), ...activeQuest('b'), { type: 'finishQuest', questId: 'a' }]),
    );
    expect(closedQuests(t).map((q) => q.id)).toEqual(['b', 'a']);
  });
});

describe('sortVault', () => {
  const s = play([
    vaultQuest('1', { title: 'beta' }),
    vaultQuest('2', { title: 'Alpha', deadline: '2026-12-20T22:59:59.000Z' }),
    vaultQuest('3', { title: 'gamma', deadline: '2026-12-10T22:59:59.000Z' }),
  ]);
  const later = play([vaultQuest('4', { title: 'delta' })], at('2026-11-30T10:00:00Z'), s);

  it('sorts newest first', () => {
    expect(sortVault(vaultQuests(later), 'newest').map((q) => q.id)).toEqual(['4', '1', '2', '3']);
  });
  it('sorts by title, case-insensitive', () => {
    expect(sortVault(vaultQuests(later), 'title').map((q) => q.title)).toEqual(['Alpha', 'beta', 'delta', 'gamma']);
  });
  it('sorts by deadline, undated last (newest first among them)', () => {
    expect(sortVault(vaultQuests(later), 'deadline').map((q) => q.id)).toEqual(['3', '2', '4', '1']);
  });
  it('does not mutate the input', () => {
    const list = vaultQuests(later);
    const ids = list.map((q) => q.id);
    sortVault(list, 'title');
    expect(list.map((q) => q.id)).toEqual(ids);
  });
});

describe('leadActionsFor', () => {
  it('returns one quest’s lead actions for a week', () => {
    const s = play([
      ...activeQuest('q1'),
      ...activeQuest('q2'),
      { type: 'addLeadAction', id: 'a', questId: 'q1', text: 'a' },
      { type: 'addLeadAction', id: 'b', questId: 'q2', text: 'b' },
      { type: 'addLeadAction', id: 'c', questId: 'q1', text: 'c', week: '2026-W49' },
    ]);
    expect(leadActionsFor(s, 'q1', '2026-W48').map((l) => l.id)).toEqual(['a']);
    expect(leadActionsFor(s, 'q1').map((l) => l.id)).toEqual(['a', 'c']);
  });
});

describe('questXp', () => {
  it('sums the XP a quest earned, with the multiplier', () => {
    const s = play([
      ...activeQuest('q1', { isPublic: true }),
      ...activeQuest('q2'),
      { type: 'addLeadAction', id: 'a', questId: 'q1', text: 'a' },
      { type: 'completeLeadAction', leadActionId: 'a' },
      { type: 'finishQuest', questId: 'q1' },
      { type: 'killQuest', questId: 'q2', reason: 'r', toldPeople: true },
    ]);
    expect(questXp(s, 'q1')).toBe(220);
    expect(questXp(s, 'q2')).toBe(30);
  });
});

describe('scoreboard', () => {
  it('summarises the board for this week', () => {
    const s = play([
      ...activeQuest('q1', { isPublic: true }),
      { type: 'addLeadAction', id: 'a', questId: 'q1', text: 'a' },
      { type: 'addLeadAction', id: 'n', questId: 'q1', text: 'next', week: '2026-W49' },
      { type: 'completeLeadAction', leadActionId: 'a' },
    ]);
    const b = scoreboard(s, NOW);
    expect(b).toMatchObject({ xp: 20, level: 1, xpIntoLevel: 20, xpToNextLevel: 280, week: '2026-W48', freeSlots: 1 });
    expect(b.progress).toBeCloseTo(20 / 300);
    expect(b.slots).toHaveLength(1);
    expect(b.slots[0]!.quest.id).toBe('q1');
    expect(b.slots[0]!.leadActions.map((l) => l.id)).toEqual(['a']);
    expect(b.slots[0]!.canAddLeadAction).toBe(true);
  });

  it('flags a quest when its weekly lead action limit is reached', () => {
    const s = play([
      ...activeQuest('q1'),
      ...['a', 'b', 'c'].map((id) => ({ type: 'addLeadAction' as const, id, questId: 'q1', text: id })),
    ]);
    expect(scoreboard(s, NOW).slots[0]!.canAddLeadAction).toBe(false);
  });
});
