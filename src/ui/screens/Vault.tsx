import { useState } from 'react';
import { closedQuests, questXp, slotsFull, sortVault, vaultQuests, type VaultSort } from '../../engine/selectors';
import type { Quest } from '../../engine/types';
import { useGame } from '../../store/useGame';
import { Badge, Button, inputClass } from '../components/ui';
import { ActivateDialog } from '../dialogs/ActivateDialog';
import { QuestFormDialog } from '../dialogs/QuestFormDialog';
import { deadlineLabel, formatDate } from '../format';
import { href } from '../router';

type Dialog = { kind: 'new' } | { kind: 'edit'; quest: Quest } | { kind: 'activate'; quest: Quest } | null;

export function Vault({ now }: { now: Date }) {
  const game = useGame((s) => s.game);
  const [sort, setSort] = useState<VaultSort>('newest');
  const [dialog, setDialog] = useState<Dialog>(null);
  const ideas = sortVault(vaultQuests(game), sort);
  const closed = closedQuests(game);
  const full = slotsFull(game);
  const close = () => setDialog(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vault</h1>
          <p className="text-sm text-slate-500">
            {ideas.length} parked {ideas.length === 1 ? 'idea' : 'ideas'}. Parked is not forgotten.
          </p>
        </div>
        <div className="flex gap-2">
          <select aria-label="Sort Vault" className={`${inputClass} w-auto py-2 text-sm`} value={sort} onChange={(e) => setSort(e.target.value as VaultSort)}>
            <option value="newest">Newest</option>
            <option value="deadline">Deadline</option>
            <option value="title">Title</option>
          </select>
          <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
            + Add idea
          </Button>
        </div>
      </header>

      {full && (
        <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-400">
          🔒 Both slots are full. You can park ideas here, but activating one means finishing or killing a quest first.
        </p>
      )}

      {ideas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-800 p-10 text-center text-slate-500">
          The Vault is empty. Park every new idea here instead of starting it.
        </div>
      ) : (
        <ul className="space-y-3">
          {ideas.map((q) => {
            const deadline = q.deadline ? deadlineLabel(q.deadline, now) : undefined;
            return (
              <li key={q.id} aria-label={`Vault quest: ${q.title}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={href.quest(q.id)} className="font-medium text-slate-100 hover:text-amber-300">
                      {q.title}
                    </a>
                    {q.isPublic && <Badge tone="amber">Public ×2</Badge>}
                    {deadline && <Badge tone={deadline.tone === 'late' ? 'rose' : 'slate'}>{deadline.text}</Badge>}
                  </div>
                  {q.boss ? <p className="text-sm text-slate-400 truncate">Boss: {q.boss}</p> : <p className="text-sm text-amber-300/70">No boss yet</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" onClick={() => setDialog({ kind: 'edit', quest: q })}>
                    Edit
                  </Button>
                  <Button variant={full ? 'secondary' : 'primary'} onClick={() => setDialog({ kind: 'activate', quest: q })}>
                    {full ? '🔒 Activate' : 'Activate'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {closed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-slate-500">Closed quests</h2>
          <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
            {closed.map((q) => (
              <li key={q.id} className="flex items-center gap-3 p-3 text-sm">
                <span aria-hidden>{q.status === 'finished' ? '🏆' : '🗡️'}</span>
                <a href={href.quest(q.id)} className="flex-1 truncate text-slate-300 hover:text-amber-300">
                  {q.title}
                </a>
                <span className="text-slate-500 hidden sm:inline">{q.closedAt && formatDate(q.closedAt)}</span>
                <span className="tabular-nums text-amber-300/80">{questXp(game, q.id)} XP</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dialog?.kind === 'new' && <QuestFormDialog onClose={close} />}
      {dialog?.kind === 'edit' && <QuestFormDialog quest={dialog.quest} onClose={close} />}
      {dialog?.kind === 'activate' && <ActivateDialog quest={dialog.quest} onClose={close} />}
    </div>
  );
}
