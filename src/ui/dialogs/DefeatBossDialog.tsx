import { CONFIG } from '../../engine/config';
import type { Quest } from '../../engine/types';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui';
import { celebrate } from '../celebrate';
import { href, navigate } from '../router';
import { runCommand } from '../useCommand';

export function DefeatBossDialog({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const xp = CONFIG.xp.bossDefeated * (quest.isPublic ? CONFIG.publicMultiplier : 1);
  const defeat = () => {
    if (runCommand({ type: 'finishQuest', questId: quest.id }, 'boss defeated')) {
      celebrate();
      onClose();
      navigate(href.dashboard);
    }
  };
  return (
    <Modal title="Defeat the boss" onClose={onClose}>
      <blockquote className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-4 text-lg text-slate-100 mb-4">“{quest.boss}”</blockquote>
      <p className="text-slate-300 mb-1 font-medium">Is this true now?</p>
      <p className="text-sm text-slate-500 mb-6">All of it, today. No partial credit.</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} data-autofocus>
          Not yet
        </Button>
        <Button variant="win" onClick={defeat}>
          Yes, it's true (+{xp} XP)
        </Button>
      </div>
    </Modal>
  );
}
