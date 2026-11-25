import { useToasts } from '../toast';

export function Toasts() {
  const { toasts, dismiss } = useToasts();
  return (
    <div aria-live="polite" className="fixed z-50 inset-x-0 bottom-20 sm:bottom-6 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto max-w-sm rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl animate-[toast-in_.25s_ease-out] ${
            t.kind === 'xp'
              ? 'bg-amber-400 text-slate-950'
              : t.kind === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-700 text-slate-100'
          }`}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
