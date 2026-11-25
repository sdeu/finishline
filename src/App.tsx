import { Toasts } from './ui/components/Toasts';
import { Dashboard } from './ui/screens/Dashboard';
import { QuestDetail } from './ui/screens/QuestDetail';
import { Vault } from './ui/screens/Vault';
import { href, useRoute, type Route } from './ui/router';
import { useNow } from './ui/useNow';

const tabs = [
  { route: 'dashboard', label: 'Board', icon: '🏁', to: href.dashboard },
  { route: 'vault', label: 'Vault', icon: '🗄️', to: href.vault },
] as const;

export default function App() {
  const route = useRoute();
  const now = useNow();
  const current = route.name === 'quest' ? null : route.name;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <a href={href.dashboard} className="flex items-center gap-2 font-bold tracking-tight">
            <span aria-hidden>🏁</span> Finish Line
          </a>
          <nav aria-label="Main" className="hidden sm:flex gap-1">
            {tabs.map((t) => (
              <a
                key={t.route}
                href={t.to}
                aria-current={current === t.route ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm ${current === t.route ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-100'}`}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-5 pb-28 sm:pb-12">
        <Screen route={route} now={now} />
      </main>

      <nav aria-label="Main mobile" className="sm:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-2 border-t border-slate-800 bg-slate-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => (
          <a
            key={t.route}
            href={t.to}
            aria-current={current === t.route ? 'page' : undefined}
            className={`flex flex-col items-center py-2 text-xs ${current === t.route ? 'text-amber-300' : 'text-slate-500'}`}
          >
            <span aria-hidden className="text-lg">
              {t.icon}
            </span>
            {t.label}
          </a>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}

function Screen({ route, now }: { route: Route; now: Date }) {
  switch (route.name) {
    case 'dashboard':
      return <Dashboard now={now} />;
    case 'vault':
      return <Vault now={now} />;
    case 'quest':
      return <QuestDetail id={route.id} now={now} />;
  }
}
