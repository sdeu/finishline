import { useState } from 'react';
import { CONFIG } from '../../engine/config';
import type { LeadAction } from '../../engine/types';
import { runCommand } from '../useCommand';
import { inputClass } from './ui';

interface Props {
  questId: string;
  questTitle: string;
  leadActions: LeadAction[];
  canAdd: boolean;
}

export function LeadActions({ questId, questTitle, leadActions, canAdd }: Props) {
  const [text, setText] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (runCommand({ type: 'addLeadAction', questId, text })) setText('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h4 className="text-xs uppercase tracking-widest text-slate-500">This week's lead actions</h4>
        <span className="text-xs text-slate-600 tabular-nums">
          {leadActions.filter((l) => l.doneAt).length}/{leadActions.length}
        </span>
      </div>
      {leadActions.length === 0 && <p className="text-sm text-slate-500">Plan up to {CONFIG.maxLeadActionsPerQuestPerWeek} actions that move this quest forward.</p>}
      <ul className="space-y-1">
        {leadActions.map((la) => (
          <li key={la.id}>
            <label className="flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-800/60 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 accent-emerald-400"
                checked={!!la.doneAt}
                onChange={() =>
                  runCommand({ type: la.doneAt ? 'undoLeadAction' : 'completeLeadAction', leadActionId: la.id }, la.doneAt ? undefined : 'lead action')
                }
              />
              <span className={la.doneAt ? 'text-slate-500 line-through' : 'text-slate-200'}>{la.text}</span>
            </label>
          </li>
        ))}
      </ul>
      {canAdd && (
        <form onSubmit={add} className="flex gap-2">
          <input
            className={`${inputClass} text-sm py-1.5`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a lead action…"
            aria-label={`New lead action for ${questTitle}`}
            maxLength={140}
          />
          <button type="submit" disabled={!text.trim()} className="rounded-lg bg-slate-800 px-3 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-40" aria-label="Add lead action">
            +
          </button>
        </form>
      )}
    </div>
  );
}
