import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

export function Modal({ title, onClose, children, tone = 'default' }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const first = panel.current?.querySelector<HTMLElement>('textarea, input, select, button[data-autofocus]');
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border bg-slate-900 p-5 shadow-2xl ${
          tone === 'danger' ? 'border-rose-500/40' : 'border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-50">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-200 -mr-1 -mt-1 p-1 text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
