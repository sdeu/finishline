import { useState } from 'react';
import type { Quest } from '../../engine/types';
import { endOfLocalDay, localDate } from '../../engine/weeks';
import { Modal } from '../components/Modal';
import { Button, Field, inputClass } from '../components/ui';
import { runCommand } from '../useCommand';

/** Create a Vault idea (no `quest`) or edit an existing quest. */
export function QuestFormDialog({ quest, onClose }: { quest?: Quest; onClose: () => void }) {
  const [title, setTitle] = useState(quest?.title ?? '');
  const [boss, setBoss] = useState(quest?.boss ?? '');
  const [deadline, setDeadline] = useState(quest?.deadline ? localDate(quest.deadline) : '');
  const [notes, setNotes] = useState(quest?.notes ?? '');
  const [isPublic, setIsPublic] = useState(quest?.isPublic ?? false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const fields = { title, boss, isPublic, notes, deadline: deadline ? endOfLocalDay(deadline) : undefined };
    const ok = quest
      ? runCommand({ type: 'updateQuest', questId: quest.id, patch: fields })
      : runCommand({ type: 'createQuest', ...fields });
    if (ok) onClose();
  };

  return (
    <Modal title={quest ? 'Edit quest' : 'New idea for the Vault'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
        </Field>
        <Field label="Boss" hint={quest?.status === 'active' ? 'One sentence that is true when the quest is done.' : 'Optional for now. Required to activate.'}>
          <textarea className={inputClass} rows={2} value={boss} onChange={(e) => setBoss(e.target.value)} maxLength={200} placeholder="e.g. The new billing flow is live for all customers." />
        </Field>
        <Field label="Deadline">
          <input type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
        </Field>
        <PublicToggle checked={isPublic} onChange={setIsPublic} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!title.trim()}>
            {quest ? 'Save' : 'Park in Vault'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function PublicToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-700 p-3 cursor-pointer hover:border-amber-400/50">
      <input type="checkbox" className="mt-0.5 size-5 accent-amber-400" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-medium text-slate-200">Public commitment (×2 XP)</span>
        <span className="block text-xs text-slate-500">I told my team or manager the deadline.</span>
      </span>
    </label>
  );
}
