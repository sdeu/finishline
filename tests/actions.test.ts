import { describe, expect, it } from 'vitest';
import {
  activateQuest,
  addLeadAction,
  applyAction,
  completeLeadAction,
  createQuest,
  finishQuest,
  killQuest,
  undoLeadAction,
  updateQuest,
} from '../src/engine/actions';
import { GameRuleError, type GameRuleCode } from '../src/engine/errors';
import { createInitialState } from '../src/engine/migrate';
import { NOW, activeQuest, at, play, vaultQuest } from './helpers';

function expectRule(fn: () => unknown, code: GameRuleCode) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(GameRuleError);
    expect((e as GameRuleError).code).toBe(code);
    expect((e as GameRuleError).message.length).toBeGreaterThan(0);
    return;
  }
  throw new Error(`expected GameRuleError ${code}, nothing was thrown`);
}

const quest = (s: ReturnType<typeof play>, id: string) => s.quests.find((q) => q.id === id)!;

describe('createQuest', () => {
  it('puts a new quest in the Vault with trimmed fields', () => {
    const s = createQuest(createInitialState(), { id: 'q1', title: '  Ship billing  ', boss: ' Invoices go out ' }, NOW);
    expect(s.quests).toEqual([
      {
        id: 'q1',
        title: 'Ship billing',
        boss: 'Invoices go out',
        isPublic: false,
        status: 'vault',
        createdAt: NOW.toISOString(),
      },
    ]);
  });

  it('allows a Vault idea without a boss', () => {
    const s = createQuest(createInitialState(), { id: 'q1', title: 'Idea' }, NOW);
    expect(quest(s, 'q1').boss).toBe('');
  });

  it('keeps optional deadline, notes and public flag', () => {
    const s = createQuest(
      createInitialState(),
      { id: 'q1', title: 'T', deadline: '2026-12-31T23:00:00.000Z', notes: 'n', isPublic: true },
      NOW,
    );
    expect(quest(s, 'q1')).toMatchObject({ deadline: '2026-12-31T23:00:00.000Z', notes: 'n', isPublic: true });
  });

  it('requires a title', () => {
    expectRule(() => createQuest(createInitialState(), { id: 'q1', title: '   ' }, NOW), 'TITLE_REQUIRED');
  });

  it('rejects a duplicate id', () => {
    const s = play([vaultQuest('q1')]);
    expectRule(() => createQuest(s, { id: 'q1', title: 'Again' }, NOW), 'DUPLICATE_ID');
  });

  it('does not mutate the input state', () => {
    const s0 = createInitialState();
    const copy = structuredClone(s0);
    createQuest(s0, { id: 'q1', title: 'T' }, NOW);
    expect(s0).toEqual(copy);
  });
});

describe('updateQuest', () => {
  it('edits a Vault quest', () => {
    const s = play([vaultQuest('q1'), { type: 'updateQuest', questId: 'q1', patch: { title: 'New', boss: '', isPublic: true } }]);
    expect(quest(s, 'q1')).toMatchObject({ title: 'New', boss: '', isPublic: true });
  });

  it('can clear the deadline and notes', () => {
    const s = play([
      vaultQuest('q1', { deadline: '2026-12-31T23:00:00.000Z', notes: 'x' }),
      { type: 'updateQuest', questId: 'q1', patch: { deadline: undefined, notes: undefined } },
    ]);
    expect(quest(s, 'q1').deadline).toBeUndefined();
    expect(quest(s, 'q1').notes).toBeUndefined();
  });

  it('will not empty the boss or title of an active quest', () => {
    const s = play(activeQuest('q1'));
    expectRule(() => updateQuest(s, { questId: 'q1', patch: { boss: ' ' } }, NOW), 'BOSS_REQUIRED');
    expectRule(() => updateQuest(s, { questId: 'q1', patch: { title: '' } }, NOW), 'TITLE_REQUIRED');
  });

  it('will not edit a closed quest', () => {
    const s = play([...activeQuest('q1'), { type: 'finishQuest', questId: 'q1' }]);
    expectRule(() => updateQuest(s, { questId: 'q1', patch: { title: 'x' } }, NOW), 'QUEST_CLOSED');
  });

  it('fails for an unknown quest', () => {
    expectRule(() => updateQuest(createInitialState(), { questId: 'nope', patch: {} }, NOW), 'QUEST_NOT_FOUND');
  });
});

describe('activateQuest', () => {
  it('moves a quest from the Vault into a slot', () => {
    const s = play(activeQuest('q1'));
    expect(quest(s, 'q1')).toMatchObject({ status: 'active', activatedAt: NOW.toISOString() });
    expect(s.events).toEqual([]);
  });

  it('requires a boss', () => {
    const s = play([vaultQuest('q1', { boss: '   ' })]);
    expectRule(() => activateQuest(s, { questId: 'q1' }, NOW), 'BOSS_REQUIRED');
  });

  it('allows exactly two active quests', () => {
    const s = play([...activeQuest('q1'), ...activeQuest('q2'), vaultQuest('q3')]);
    expect(s.quests.filter((q) => q.status === 'active')).toHaveLength(2);
    expectRule(() => activateQuest(s, { questId: 'q3' }, NOW), 'SLOTS_FULL');
  });

  it('frees a slot after finishing or killing a quest', () => {
    const base = [...activeQuest('q1'), ...activeQuest('q2'), vaultQuest('q3')];
    const finished = play([...base, { type: 'finishQuest', questId: 'q1' }, { type: 'activateQuest', questId: 'q3' }]);
    expect(quest(finished, 'q3').status).toBe('active');
    const killed = play([
      ...base,
      { type: 'killQuest', questId: 'q2', reason: 'Priorities changed', toldPeople: true },
      { type: 'activateQuest', questId: 'q3' },
    ]);
    expect(quest(killed, 'q3').status).toBe('active');
  });

  it('emergency override forces a third quest and logs it with a streak reset', () => {
    const s = play([...activeQuest('q1'), ...activeQuest('q2'), vaultQuest('q3'), { type: 'activateQuest', questId: 'q3', override: true }]);
    expect(s.quests.filter((q) => q.status === 'active')).toHaveLength(3);
    expect(s.events).toEqual([
      { type: 'OVERRIDE_USED', at: NOW.toISOString(), questId: 'q3' },
      { type: 'STREAK_RESET', at: NOW.toISOString(), reason: 'override' },
    ]);
  });

  it('override still requires a boss', () => {
    const s = play([...activeQuest('q1'), ...activeQuest('q2'), vaultQuest('q3', { boss: '' })]);
    expectRule(() => activateQuest(s, { questId: 'q3', override: true }, NOW), 'BOSS_REQUIRED');
  });

  it('override with a free slot is a normal activation with no penalty', () => {
    const s = play([vaultQuest('q1'), { type: 'activateQuest', questId: 'q1', override: true }]);
    expect(quest(s, 'q1').status).toBe('active');
    expect(s.events).toEqual([]);
  });

  it('only activates Vault quests', () => {
    const s = play(activeQuest('q1'));
    expectRule(() => activateQuest(s, { questId: 'q1' }, NOW), 'QUEST_NOT_IN_VAULT');
    expectRule(() => activateQuest(s, { questId: 'zzz' }, NOW), 'QUEST_NOT_FOUND');
  });
});

describe('finishQuest', () => {
  it('defeats the boss of an active quest', () => {
    const later = at('2026-11-26T15:00:00Z');
    const s = finishQuest(play(activeQuest('q1')), { questId: 'q1' }, later);
    expect(quest(s, 'q1')).toMatchObject({ status: 'finished', closedAt: later.toISOString() });
    expect(s.events).toEqual([{ type: 'BOSS_DEFEATED', at: later.toISOString(), questId: 'q1' }]);
  });

  it('only finishes active quests', () => {
    expectRule(() => finishQuest(play([vaultQuest('q1')]), { questId: 'q1' }, NOW), 'QUEST_NOT_ACTIVE');
    const done = play([...activeQuest('q1'), { type: 'finishQuest', questId: 'q1' }]);
    expectRule(() => finishQuest(done, { questId: 'q1' }, NOW), 'QUEST_NOT_ACTIVE');
  });
});

describe('killQuest', () => {
  it('stops an active quest with a reason', () => {
    const s = killQuest(play(activeQuest('q1')), { questId: 'q1', reason: '  No longer needed ', toldPeople: true }, NOW);
    expect(quest(s, 'q1')).toMatchObject({ status: 'killed', closedAt: NOW.toISOString(), killReason: 'No longer needed' });
    expect(s.events).toEqual([{ type: 'QUEST_KILLED', at: NOW.toISOString(), questId: 'q1' }]);
  });

  it('requires a reason', () => {
    expectRule(() => killQuest(play(activeQuest('q1')), { questId: 'q1', reason: ' ', toldPeople: true }, NOW), 'KILL_REASON_REQUIRED');
  });

  it('requires telling the people involved', () => {
    expectRule(() => killQuest(play(activeQuest('q1')), { questId: 'q1', reason: 'x', toldPeople: false }, NOW), 'KILL_MUST_TELL_PEOPLE');
  });

  it('only kills active quests', () => {
    expectRule(() => killQuest(play([vaultQuest('q1')]), { questId: 'q1', reason: 'x', toldPeople: true }, NOW), 'QUEST_NOT_ACTIVE');
  });
});

describe('lead actions', () => {
  const withQuest = () => play(activeQuest('q1'));

  it('adds a lead action to the current Zurich week by default', () => {
    const s = addLeadAction(withQuest(), { id: 'l1', questId: 'q1', text: ' Draft RFC ' }, NOW);
    expect(s.leadActions).toEqual([{ id: 'l1', questId: 'q1', week: '2026-W48', text: 'Draft RFC' }]);
  });

  it('accepts an explicit week for planning ahead', () => {
    const s = addLeadAction(withQuest(), { id: 'l1', questId: 'q1', text: 'x', week: '2026-W49' }, NOW);
    expect(s.leadActions[0]!.week).toBe('2026-W49');
  });

  it('requires text and an active quest', () => {
    expectRule(() => addLeadAction(withQuest(), { id: 'l1', questId: 'q1', text: '' }, NOW), 'LEAD_ACTION_TEXT_REQUIRED');
    expectRule(() => addLeadAction(play([vaultQuest('q2')]), { id: 'l1', questId: 'q2', text: 'x' }, NOW), 'QUEST_NOT_ACTIVE');
    expectRule(() => addLeadAction(withQuest(), { id: 'l1', questId: 'nope', text: 'x' }, NOW), 'QUEST_NOT_FOUND');
  });

  it('rejects a duplicate id', () => {
    const s = addLeadAction(withQuest(), { id: 'l1', questId: 'q1', text: 'x' }, NOW);
    expectRule(() => addLeadAction(s, { id: 'l1', questId: 'q1', text: 'y' }, NOW), 'DUPLICATE_ID');
  });

  it('allows at most 3 per quest per week', () => {
    const s = play(
      [
        ...activeQuest('q1'),
        ...activeQuest('q2'),
        ...['a', 'b', 'c'].map((id) => ({ type: 'addLeadAction' as const, id, questId: 'q1', text: id })),
      ],
    );
    expectRule(() => addLeadAction(s, { id: 'd', questId: 'q1', text: 'd' }, NOW), 'LEAD_ACTION_LIMIT');
    // other quest and next week are unaffected
    expect(addLeadAction(s, { id: 'd', questId: 'q2', text: 'd' }, NOW).leadActions).toHaveLength(4);
    expect(addLeadAction(s, { id: 'd', questId: 'q1', text: 'd', week: '2026-W49' }, NOW).leadActions).toHaveLength(4);
  });

  it('completing a lead action logs an event', () => {
    const s = play([...activeQuest('q1'), { type: 'addLeadAction', id: 'l1', questId: 'q1', text: 'x' }, { type: 'completeLeadAction', leadActionId: 'l1' }]);
    expect(s.leadActions[0]!.doneAt).toBe(NOW.toISOString());
    expect(s.events).toEqual([{ type: 'LEAD_ACTION_DONE', at: NOW.toISOString(), leadActionId: 'l1', questId: 'q1' }]);
  });

  it('cannot complete twice, an unknown action, or one whose quest is closed', () => {
    const s = play([...activeQuest('q1'), { type: 'addLeadAction', id: 'l1', questId: 'q1', text: 'x' }, { type: 'addLeadAction', id: 'l2', questId: 'q1', text: 'y' }]);
    const done = completeLeadAction(s, { leadActionId: 'l1' }, NOW);
    expectRule(() => completeLeadAction(done, { leadActionId: 'l1' }, NOW), 'LEAD_ACTION_ALREADY_DONE');
    expectRule(() => completeLeadAction(s, { leadActionId: 'nope' }, NOW), 'LEAD_ACTION_NOT_FOUND');
    const finished = finishQuest(s, { questId: 'q1' }, NOW);
    expectRule(() => completeLeadAction(finished, { leadActionId: 'l2' }, NOW), 'QUEST_NOT_ACTIVE');
  });

  describe('undo (same Zurich day only)', () => {
    const done = () =>
      play([...activeQuest('q1'), { type: 'addLeadAction', id: 'l1', questId: 'q1', text: 'x' }, { type: 'completeLeadAction', leadActionId: 'l1' }]);

    it('removes the event and clears doneAt on the same day', () => {
      const s = undoLeadAction(done(), { leadActionId: 'l1' }, at('2026-11-24T22:59:00Z')); // 23:59 Zurich
      expect(s.leadActions[0]!.doneAt).toBeUndefined();
      expect(s.events).toEqual([]);
    });

    it('is closed after midnight in Zurich', () => {
      expectRule(() => undoLeadAction(done(), { leadActionId: 'l1' }, at('2026-11-24T23:00:00Z')), 'UNDO_WINDOW_CLOSED');
    });

    it('fails for an action that is not done or unknown', () => {
      const s = play([...activeQuest('q1'), { type: 'addLeadAction', id: 'l1', questId: 'q1', text: 'x' }]);
      expectRule(() => undoLeadAction(s, { leadActionId: 'l1' }, NOW), 'LEAD_ACTION_NOT_DONE');
      expectRule(() => undoLeadAction(s, { leadActionId: 'zz' }, NOW), 'LEAD_ACTION_NOT_FOUND');
    });

    it('leaves other events untouched', () => {
      const s = play([{ type: 'addLeadAction', id: 'l2', questId: 'q1', text: 'y' }, { type: 'completeLeadAction', leadActionId: 'l2' }], NOW, done());
      const undone = undoLeadAction(s, { leadActionId: 'l1' }, NOW);
      expect(undone.events).toEqual([{ type: 'LEAD_ACTION_DONE', at: NOW.toISOString(), leadActionId: 'l2', questId: 'q1' }]);
    });
  });
});

describe('applyAction', () => {
  it('dispatches every action type', () => {
    const s = applyAction(createInitialState(), { type: 'createQuest', id: 'q1', title: 'T', boss: 'B' }, NOW);
    expect(s.quests).toHaveLength(1);
  });
});
