import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { createInitialState } from '../../src/engine/migrate';
import { useGame } from '../../src/store/useGame';
import { useToasts } from '../../src/ui/toast';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ game: createInitialState() });
  useToasts.setState({ toasts: [] });
  window.location.hash = '';
});

afterEach(() => cleanup());
