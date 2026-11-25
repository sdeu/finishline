// @vitest-environment jsdom
import './setup';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/engine/migrate';
import { totalXp } from '../../src/engine/scoring';
import { STORAGE_KEY, useGame } from '../../src/store/useGame';

const store = () => useGame.getState();

describe('useGame store', () => {
  it('fills in ids and applies commands through the engine', () => {
    const r = store().dispatch({ type: 'createQuest', title: 'T', boss: 'B' });
    expect(r.ok).toBe(true);
    expect(store().game.quests[0]!.id).toMatch(/[0-9a-f-]{36}/);
  });

  it('returns rule errors without changing state', () => {
    const before = store().game;
    const r = store().dispatch({ type: 'activateQuest', questId: 'nope' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('QUEST_NOT_FOUND');
    expect(store().game).toBe(before);
  });

  it('applies a batch atomically', () => {
    store().dispatch({ type: 'createQuest', id: 'q1', title: 'T' });
    const r = store().dispatch([
      { type: 'updateQuest', questId: 'q1', patch: { boss: 'Done' } },
      { type: 'activateQuest', questId: 'missing' },
    ]);
    expect(r.ok).toBe(false);
    expect(store().game.quests[0]!.boss).toBe('');
  });

  it('survives a reload: Vault → active → finished with correct XP', async () => {
    store().dispatch([
      { type: 'createQuest', id: 'q1', title: 'Ship it', boss: 'It shipped', isPublic: true },
      { type: 'activateQuest', questId: 'q1' },
      { type: 'addLeadAction', id: 'l1', questId: 'q1', text: 'Write tests' },
      { type: 'completeLeadAction', leadActionId: 'l1' },
      { type: 'finishQuest', questId: 'q1' },
    ]);
    const saved = store().game;
    const raw = localStorage.getItem(STORAGE_KEY)!;
    expect(raw).toContain('Ship it');

    // simulate a fresh page: in-memory state gone, storage as the last session left it
    useGame.setState({ game: createInitialState() });
    localStorage.setItem(STORAGE_KEY, raw);
    await useGame.persist.rehydrate();

    expect(store().game).toEqual(saved);
    expect(store().game.quests[0]!.status).toBe('finished');
    expect(totalXp(store().game)).toBe(220);
  });

  it('keeps an unreadable save aside and starts fresh', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { game: { schemaVersion: 999 } }, version: 0 }));
    const err = console.error;
    console.error = () => {};
    await useGame.persist.rehydrate();
    console.error = err;
    expect(store().game).toEqual(createInitialState());
    expect(Object.keys(localStorage).some((k) => k.startsWith(`${STORAGE_KEY}-unreadable-`))).toBe(true);
  });
});
