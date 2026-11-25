import type { SlotView } from '../../engine/selectors';
import { href } from '../router';
import { deadlineLabel } from '../format';
import { LeadActions } from './LeadActions';
import { Badge } from './ui';

export function QuestSlot({ slot, now }: { slot: SlotView; now: Date }) {
  const { quest } = slot;
  const deadline = quest.deadline ? deadlineLabel(quest.deadline, now) : undefined;
  return (
    <article aria-label={`Quest: ${quest.title}`} className="rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-800/80 to-slate-900 p-5 shadow-lg space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {quest.isPublic && <Badge tone="amber">Public ×2</Badge>}
          {deadline && <Badge tone={deadline.tone === 'late' ? 'rose' : deadline.tone === 'soon' ? 'amber' : 'slate'}>{deadline.text}</Badge>}
        </div>
        <h3 className="text-xl font-semibold leading-tight">
          <a href={href.quest(quest.id)} className="text-slate-50 hover:text-amber-300">
            {quest.title}
          </a>
        </h3>
        <p className="text-sm text-slate-300">
          <span className="text-rose-300 font-medium">Boss: </span>
          {quest.boss}
        </p>
      </header>
      <LeadActions questId={quest.id} questTitle={quest.title} leadActions={slot.leadActions} canAdd={slot.canAddLeadAction} />
      <a href={href.quest(quest.id)} className="inline-block text-sm text-amber-300 hover:text-amber-200">
        Open quest →
      </a>
    </article>
  );
}

export function EmptySlot({ index }: { index: number }) {
  return (
    <a
      href={href.vault}
      className="group flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 p-6 text-center hover:border-amber-400/60 hover:bg-amber-400/5 transition"
    >
      <span className="text-3xl text-slate-600 group-hover:text-amber-300">+</span>
      <span className="font-medium text-slate-300">Slot {index} is open</span>
      <span className="text-sm text-slate-500">Pick one quest from the Vault and give it a boss.</span>
    </a>
  );
}
