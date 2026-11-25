import { useState } from 'react';
import { leadActionsFor, questXp, scoreboard } from '../../engine/selectors';
import type { LeadAction } from '../../engine/types';
import { useGame } from '../../store/useGame';
import { LeadActions } from '../components/LeadActions';
import { Badge, Button } from '../components/ui';
import { ActivateDialog } from '../dialogs/ActivateDialog';
import { DefeatBossDialog } from '../dialogs/DefeatBossDialog';
import { KillDialog } from '../dialogs/KillDialog';
import { QuestFormDialog } from '../dialogs/QuestFormDialog';
import { deadlineLabel, formatDate } from '../format';
import { href } from '../router';

const statusBadge = {
  vault: <Badge>In Vault</Badge>,
  active: <Badge tone="sky">Active</Badge>,
  finished: <Badge tone="emerald">Boss defeated</Badge>,
  killed: <Badge tone="rose">Killed</Badge>,
};

type Dialog = 'edit' | 'activate' | 'defeat' | 'kill' | null;

export function QuestDetail({ id, now }: { id: string; now: Date }) {
  const game = useGame((s) => s.game);
  const [dialog, setDialog] = useState<Dialog>(null);
  const quest = game.quests.find((q) => q.id === id);

  if (!quest) {
    return (
      <div className="text-center space-y-4 py-16">
        <p className="text-slate-400">This quest does not exist.</p>
        <a href={href.dashboard} className="text-amber-300">
          Back to the board
        </a>
      </div>
    );
  }

  const board = scoreboard(game, now);
  const slot = board.slots.find((s) => s.quest.id === quest.id);
  // This week's actions of an active quest are shown in the editable list above, not in history.
  const history = groupByWeek(leadActionsFor(game, quest.id).filter((l) => !slot || l.week !== board.week));
  const deadline = quest.deadline ? deadlineLabel(quest.deadline, now) : undefined;
  const close = () => setDialog(null);

  return (
    <div className="space-y-6">
      <a href={quest.status === 'vault' ? href.vault : href.dashboard} className="text-sm text-slate-500 hover:text-slate-300">
        ← Back
      </a>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge[quest.status]}
          {quest.isPublic && <Badge tone="amber">Public ×2</Badge>}
          {deadline && quest.status !== 'finished' && quest.status !== 'killed' && (
            <Badge tone={deadline.tone === 'late' ? 'rose' : deadline.tone === 'soon' ? 'amber' : 'slate'}>{deadline.text}</Badge>
          )}
          <span className="ml-auto text-sm tabular-nums text-amber-300/80">{questXp(game, quest.id)} XP earned</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">{quest.title}</h1>
      </header>

      <section className="rounded-2xl border border-rose-400/30 bg-rose-400/5 p-4">
        <h2 className="text-xs uppercase tracking-widest text-rose-300 mb-1">Boss</h2>
        <p className="text-lg text-slate-100">{quest.boss || <span className="text-slate-500">No boss defined yet.</span>}</p>
      </section>

      {quest.status === 'killed' && quest.killReason && (
        <section className="rounded-xl border border-slate-800 p-4 text-sm">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-1">Why it was killed</h2>
          <p className="text-slate-300">{quest.killReason}</p>
        </section>
      )}
      {quest.closedAt && <p className="text-sm text-slate-500">Closed on {formatDate(quest.closedAt)}.</p>}

      <div className="flex flex-wrap gap-2">
        {quest.status === 'active' && (
          <>
            <Button variant="win" onClick={() => setDialog('defeat')}>
              ⚔️ Defeat boss
            </Button>
            <Button variant="danger" onClick={() => setDialog('kill')}>
              Kill quest
            </Button>
          </>
        )}
        {quest.status === 'vault' && (
          <Button variant="primary" onClick={() => setDialog('activate')}>
            Activate
          </Button>
        )}
        {(quest.status === 'vault' || quest.status === 'active') && (
          <Button variant="ghost" onClick={() => setDialog('edit')}>
            Edit
          </Button>
        )}
      </div>

      {slot && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <LeadActions questId={quest.id} questTitle={quest.title} leadActions={slot.leadActions} canAdd={slot.canAddLeadAction} />
        </section>
      )}

      {quest.notes && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Notes</h2>
          <p className="whitespace-pre-wrap text-slate-300">{quest.notes}</p>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-slate-500">Lead action history</h2>
          {history.map(([week, items]) => (
            <div key={week}>
              <h3 className="text-sm text-slate-400 mb-1">Week {week.split('-W')[1]}</h3>
              <ul className="space-y-1 text-sm">
                {items.map((l) => (
                  <li key={l.id} className={l.doneAt ? 'text-slate-300' : 'text-slate-600'}>
                    <span aria-hidden className="mr-2">{l.doneAt ? '✓' : '○'}</span>
                    {l.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {dialog === 'edit' && <QuestFormDialog quest={quest} onClose={close} />}
      {dialog === 'activate' && <ActivateDialog quest={quest} onClose={close} />}
      {dialog === 'defeat' && <DefeatBossDialog quest={quest} onClose={close} />}
      {dialog === 'kill' && <KillDialog quest={quest} onClose={close} />}
    </div>
  );
}

function groupByWeek(items: LeadAction[]): [string, LeadAction[]][] {
  const map = new Map<string, LeadAction[]>();
  for (const l of items) map.set(l.week, [...(map.get(l.week) ?? []), l]);
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
}
