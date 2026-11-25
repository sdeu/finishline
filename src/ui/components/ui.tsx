import { cloneElement, useId, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'win';

const variants: Record<Variant, string> = {
  primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold',
  win: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 font-semibold',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
  danger: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/40',
  ghost: 'text-slate-400 hover:text-slate-100',
};

export function Button({ variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${variants[variant]} ${className}`}
    />
  );
}

/** A labelled form control. The hint is linked with aria-describedby, not part of the label. */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactElement<{ id?: string; 'aria-describedby'?: string }> }) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      {cloneElement(children, { id, 'aria-describedby': hint ? hintId : undefined })}
      {hint && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-amber-400 focus:outline-none';

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'amber' | 'emerald' | 'rose' | 'sky' }) {
  const tones = {
    slate: 'bg-slate-800 text-slate-300',
    amber: 'bg-amber-400/15 text-amber-300',
    emerald: 'bg-emerald-400/15 text-emerald-300',
    rose: 'bg-rose-500/15 text-rose-300',
    sky: 'bg-sky-400/15 text-sky-300',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
