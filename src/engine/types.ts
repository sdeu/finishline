/** ISO 8601 timestamp, e.g. '2026-11-24T19:46:00.000Z'. */
export type ISODate = string;
/** ISO week key in Europe/Zurich, e.g. '2026-W48'. */
export type WeekKey = string;

export type QuestStatus = 'vault' | 'active' | 'finished' | 'killed';

export interface Quest {
  id: string;
  title: string;
  /** Definition of done. Required to activate. */
  boss: string;
  deadline?: ISODate;
  /** Deadline told to team or manager: x2 on lead action and boss XP. */
  isPublic: boolean;
  status: QuestStatus;
  createdAt: ISODate;
  activatedAt?: ISODate;
  closedAt?: ISODate;
  killReason?: string;
  notes?: string;
}

export interface LeadAction {
  id: string;
  questId: string;
  week: WeekKey;
  text: string;
  doneAt?: ISODate;
}

export type CourageRarity = 'common' | 'rare' | 'epic';
export type CourageTag =
  | 'asked-commitment'
  | 'followed-up'
  | 'said-no'
  | 'disagreed'
  | 'difficult-talk'
  | 'other';

export interface CourageCard {
  id: string;
  rarity: CourageRarity;
  tag: CourageTag;
  note: string;
  questId?: string;
  at: ISODate;
}

export interface SavePoint {
  week: WeekKey;
  completedAt: ISODate;
  lesson: string;
  wins: string;
}

export interface LevelReward {
  level: number;
  reward: string;
  claimedAt?: ISODate;
}

export type GameEvent =
  | { type: 'LEAD_ACTION_DONE'; at: ISODate; leadActionId: string; questId: string }
  | { type: 'BOSS_DEFEATED'; at: ISODate; questId: string }
  | { type: 'QUEST_KILLED'; at: ISODate; questId: string }
  | { type: 'QUEST_DRIFTED'; at: ISODate; questId: string }
  | { type: 'COURAGE_LOGGED'; at: ISODate; cardId: string; rarity: CourageRarity }
  | { type: 'SAVE_POINT'; at: ISODate; week: WeekKey }
  | { type: 'OVERRIDE_USED'; at: ISODate; questId: string }
  | { type: 'STREAK_RESET'; at: ISODate; reason: 'missed-week' | 'override' };

export type GameEventType = GameEvent['type'];

export interface GameState {
  schemaVersion: 1;
  quests: Quest[];
  leadActions: LeadAction[];
  courageCards: CourageCard[];
  savePoints: SavePoint[];
  rewards: LevelReward[];
  /** Append-only log (except same-day lead action undo). The only source of XP. */
  events: GameEvent[];
  unlockedAchievements: { id: string; at: ISODate }[];
  settings: { timezone: 'Europe/Zurich'; weeklyCourageTarget: number };
}
