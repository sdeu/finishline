import { useState } from 'react';
import { CONFIG } from '../../engine/config';
import { activeQuests, slotsFull } from '../../engine/selectors';
import type { Quest } from '../../engine/types';
import { useGame } from '../../store/useGame';
import { Modal } from '../components/Modal';
import { Button, Field, inputClass } from '../components/ui';
import { href, navigate } from '../router';
import { runCommand } from '../useCommand';
import { PublicToggle } from './QuestFormDialog';

export function ActivateDialog({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const game = useGame((s) => s.game);
  const full = slotsFull(game);
  const [override, setOverride] = useState(false);
  const [boss, setBoss] = useState(quest.boss);
  const [isPublic, setIsPublic] = useState(quest.isPublic);

  if (full && !override) {
    return (
      <Modal title="Finish or kill a quest first" onClose={onClose}>
        <p className="text-sm text-slate-300 mb-4">
          Both quest slots are taken. Starting more work won't finish anything. Close one of these first:
        </p>
        <div className="space-y-2 mb-6">
          {activeQuests(game).map((q) => (
            <Button key={q.id} variant="secondary" className="w-full justify-between" data-autofocus onClick={() => navigate(href.quest(q.id))}>
              <span className="truncate">{q.title}</span>
              <span aria-hidden>→</span>
            </Button>
          ))}
        </div>
        <button onClick={() => setOverride(true)} className="text-xs text-rose-400/80 underline underline-offset-2 hover:text-rose-300">
          Emergency override
        </button>
      </Modal>
    );
  }

  const activate = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = runCommand([
      { type: 'updateQuest', questId: quest.id, patch: { boss, isPublic } },
      { type: 'activateQuest', questId: quest.id, override: full && override },
    ]);
    if (ok) {
      onClose();
      navigate(href.dashboard);
    }
  };

  return (
    <Modal title={override ? 'Emergency override' : `Activate “${quest.title}”`} onClose={onClose} tone={override ? 'danger' : 'default'}>
      <form onSubmit={activate} className="space-y-4">
        {override && (
          <p role="alert" className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-200">
            This goes past the limit of {CONFIG.maxActiveQuests} active quests. Your streak resets to 0 and the override is logged.
          </p>
        )}
        <Field label="Boss" hint="One sentence that is true when this quest is done. No boss, no quest.">
          <textarea className={inputClass} rows={2} value={boss} onChange={(e) => setBoss(e.target.value)} maxLength={200} required />
        </Field>
        <PublicToggle checked={isPublic} onChange={setIsPublic} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={override ? 'danger' : 'primary'} disabled={!boss.trim()}>
            {override ? 'Override and activate' : 'Activate quest'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
