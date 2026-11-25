import type { Scoreboard } from '../../engine/selectors';

export function XpBar({ board }: { board: Scoreboard }) {
  const pct = Math.round(board.progress * 100);
  return (
    <section aria-label="Experience" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-500">Level</span>
          <span className="text-2xl font-bold text-amber-300" data-testid="level">
            {board.level}
          </span>
        </div>
        <span className="text-sm text-slate-400 tabular-nums">
          <span data-testid="xp" className="text-slate-100 font-semibold">
            {board.xp}
          </span>{' '}
          XP · {board.xpToNextLevel} to level {board.level + 1}
        </span>
      </div>
      <div
        className="h-3 rounded-full bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-label={`Level ${board.level} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_14px_rgba(251,191,36,0.7)] transition-[width] duration-700"
          style={{ width: `${Math.max(pct, board.xp > 0 ? 2 : 0)}%` }}
        />
      </div>
    </section>
  );
}
