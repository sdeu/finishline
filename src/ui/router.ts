import { useEffect, useState } from 'react';

export type Route = { name: 'dashboard' } | { name: 'vault' } | { name: 'quest'; id: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const quest = /^\/quest\/(.+)$/.exec(path);
  if (quest) return { name: 'quest', id: decodeURIComponent(quest[1]!) };
  if (path === '/vault') return { name: 'vault' };
  return { name: 'dashboard' };
}

export const href = {
  dashboard: '#/',
  vault: '#/vault',
  quest: (id: string) => `#/quest/${encodeURIComponent(id)}`,
};

export function navigate(to: string) {
  window.location.hash = to;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
