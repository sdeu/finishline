import { CONFIG } from '../../engine/config';
import { scoreboard } from '../../engine/selectors';
import { useGame } from '../../store/useGame';
import { EmptySlot, QuestSlot } from '../components/QuestSlot';
import { XpBar } from '../components/XpBar';
import { href } from '../router';

export function Dashboard({ now }: { now: Date }) {
  const game = useGame((s) => s.game);
  const board = scoreboard(game, now);
  const empty = Array.from({ length: board.freeSlots }, (_, i) => board.slots.length + i + 1);

  return (
    <div className="space-y-5">
      <XpBar board={board} />
      <section aria-label="Quest slots" className="grid gap-4 md:grid-cols-2">
        {board.slots.map((slot) => (
          <QuestSlot key={slot.quest.id} slot={slot} now={now} />
        ))}
        {empty.map((n) => (
          <EmptySlot key={n} index={n} />
        ))}
      </section>
      {board.freeSlots === 0 && (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span aria-hidden>🔒</span> Board locked at {CONFIG.maxActiveQuests} quests. Finish or kill one to start another.{' '}
          <a href={href.vault} className="text-slate-400 underline underline-offset-2 hover:text-slate-200">
            Vault
          </a>
        </p>
      )}
      <p className="text-center text-xs text-slate-600">Week {board.week.split('-W')[1]}</p>
    </div>
  );
}
