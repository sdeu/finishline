import { useState } from 'react';
import { CONFIG } from '../../engine/config';
import type { Quest } from '../../engine/types';
import { Modal } from '../components/Modal';
import { Button, Field, inputClass } from '../components/ui';
import { href, navigate } from '../router';
import { runCommand } from '../useCommand';

export function KillDialog({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [told, setTold] = useState(false);
  const kill = (e: React.FormEvent) => {
    e.preventDefault();
    if (runCommand({ type: 'killQuest', questId: quest.id, reason, toldPeople: told }, 'clean kill')) {
      onClose();
      navigate(href.dashboard);
    }
  };
  return (
    <Modal title={`Kill “${quest.title}”`} onClose={onClose} tone="danger">
      <form onSubmit={kill} className="space-y-4">
        <p className="text-sm text-slate-400">Stopping on purpose is a win. Leaving it to rot is not.</p>
        <Field label="Why are you stopping?">
          <textarea className={inputClass} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} required />
        </Field>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="size-5 accent-rose-400" checked={told} onChange={(e) => setTold(e.target.checked)} />
          <span className="text-sm text-slate-200">I told the people involved.</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={!reason.trim() || !told}>
            Kill quest (+{CONFIG.xp.questKilled} XP)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
