import { totalXp } from '../engine/scoring';
import { useGame, type GameCommand } from '../store/useGame';
import { toast } from './toast';

/**
 * Dispatch commands; show rule violations as an error toast and XP gains as an XP toast.
 * Returns true on success.
 */
export function runCommand(commands: GameCommand | GameCommand[], xpLabel?: string): boolean {
  const before = totalXp(useGame.getState().game);
  const result = useGame.getState().dispatch(commands);
  if (!result.ok) {
    toast.error(result.error.message);
    return false;
  }
  const gained = totalXp(result.state) - before;
  if (gained > 0) toast.xp(`+${gained} XP${xpLabel ? ` · ${xpLabel}` : ''}`);
  return true;
}
