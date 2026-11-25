import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applyAction, type GameAction } from '../engine/actions';
import { GameRuleError } from '../engine/errors';
import { createInitialState, migrate } from '../engine/migrate';
import type { GameState } from '../engine/types';

export const STORAGE_KEY = 'finish-line';

/** Actions as the UI sends them: ids are filled in by the store. */
export type GameCommand =
  | Exclude<GameAction, { type: 'createQuest' | 'addLeadAction' }>
  | (Omit<Extract<GameAction, { type: 'createQuest' }>, 'id'> & { id?: string })
  | (Omit<Extract<GameAction, { type: 'addLeadAction' }>, 'id'> & { id?: string });

export type DispatchResult = { ok: true; state: GameState } | { ok: false; error: GameRuleError };

interface GameStore {
  game: GameState;
  /** Apply one or more commands atomically: all succeed or nothing changes. */
  dispatch: (commands: GameCommand | GameCommand[], now?: Date) => DispatchResult;
}

const newId = () => crypto.randomUUID();

function withId(command: GameCommand): GameAction {
  if (command.type === 'createQuest' || command.type === 'addLeadAction') {
    return { ...command, id: command.id ?? newId() } as GameAction;
  }
  return command;
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      game: createInitialState(),
      dispatch: (commands, now = new Date()) => {
        const list = Array.isArray(commands) ? commands : [commands];
        try {
          const next = list.reduce((s, c) => applyAction(s, withId(c), now), get().game);
          set({ game: next });
          return { ok: true, state: next };
        } catch (e) {
          if (e instanceof GameRuleError) return { ok: false, error: e };
          throw e;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ game: s.game }),
      merge: (persisted, current) => {
        const game = (persisted as { game?: unknown } | undefined)?.game;
        if (game === undefined) return current;
        try {
          return { ...current, game: migrate(game) };
        } catch (e) {
          // Keep the unreadable save untouched in storage under a backup key and start fresh.
          console.error('Could not load saved game', e);
          try {
            localStorage.setItem(`${STORAGE_KEY}-unreadable-${Date.now()}`, JSON.stringify(persisted));
          } catch {
            /* storage full or blocked */
          }
          return current;
        }
      },
    },
  ),
);
