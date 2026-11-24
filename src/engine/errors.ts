export type GameRuleCode =
  | 'QUEST_NOT_FOUND'
  | 'LEAD_ACTION_NOT_FOUND'
  | 'DUPLICATE_ID'
  | 'TITLE_REQUIRED'
  | 'BOSS_REQUIRED'
  | 'SLOTS_FULL'
  | 'QUEST_NOT_IN_VAULT'
  | 'QUEST_NOT_ACTIVE'
  | 'QUEST_CLOSED'
  | 'KILL_REASON_REQUIRED'
  | 'KILL_MUST_TELL_PEOPLE'
  | 'LEAD_ACTION_TEXT_REQUIRED'
  | 'LEAD_ACTION_LIMIT'
  | 'LEAD_ACTION_ALREADY_DONE'
  | 'LEAD_ACTION_NOT_DONE'
  | 'UNDO_WINDOW_CLOSED';

/** A player action broke a game rule. The UI shows `message` to the player. */
export class GameRuleError extends Error {
  constructor(
    public readonly code: GameRuleCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameRuleError';
  }
}
