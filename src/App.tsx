import { CONFIG } from './engine/config';

export default function App() {
  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-5xl" aria-hidden>🏁</div>
        <h1 className="text-4xl font-bold tracking-tight">Finish Line</h1>
        <p className="text-slate-400">
          Finish what you start. Two quest slots, one boss each, and the courage to say no.
        </p>
        <div className="grid grid-cols-2 gap-3" aria-label="Quest slots">
          {Array.from({ length: CONFIG.maxActiveQuests }, (_, i) => (
            <div key={i} className="rounded-xl border-2 border-dashed border-slate-700 p-6 text-slate-500 text-sm">
              Slot {i + 1}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600">Phase 1 · engine ready, game board coming next</p>
      </div>
    </main>
  );
}
