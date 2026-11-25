// @vitest-environment jsdom
import './setup';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';
import { useGame } from '../../src/store/useGame';

const game = () => useGame.getState().game;

function seed(...quests: { id: string; title: string; boss?: string; active?: boolean }[]) {
  for (const q of quests) {
    useGame.getState().dispatch({ type: 'createQuest', id: q.id, title: q.title, boss: q.boss ?? `${q.title} done` });
    if (q.active) useGame.getState().dispatch({ type: 'activateQuest', questId: q.id });
  }
}

async function goTo(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Finish Line app', () => {
  it('shows two open slots and level 1 on a new game', () => {
    render(<App />);
    expect(screen.getByText('Slot 1 is open')).toBeInTheDocument();
    expect(screen.getByText('Slot 2 is open')).toBeInTheDocument();
    expect(screen.getByTestId('level')).toHaveTextContent('1');
    expect(screen.getByTestId('xp')).toHaveTextContent('0');
  });

  it('parks an idea, activates it with a boss, ticks a lead action and defeats the boss', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/vault');

    await user.click(await screen.findByRole('button', { name: '+ Add idea' }));
    await user.type(screen.getByLabelText('Title'), 'Hire a tech lead');
    await user.click(screen.getByRole('button', { name: 'Park in Vault' }));
    const card = await screen.findByRole('listitem', { name: 'Vault quest: Hire a tech lead' });
    expect(within(card).getByText('No boss yet')).toBeInTheDocument();

    // activation is blocked until the boss is filled in
    await user.click(within(card).getByRole('button', { name: 'Activate' }));
    const activate = screen.getByRole('button', { name: 'Activate quest' });
    expect(activate).toBeDisabled();
    await user.type(screen.getByLabelText('Boss'), 'Signed offer from a tech lead');
    await user.click(activate);

    const slot = await screen.findByRole('article', { name: 'Quest: Hire a tech lead' });
    expect(within(slot).getByText('Signed offer from a tech lead')).toBeInTheDocument();

    await user.type(within(slot).getByLabelText('New lead action for Hire a tech lead'), 'Call two recruiters{Enter}');
    await user.click(within(slot).getByRole('checkbox', { name: 'Call two recruiters' }));
    expect(screen.getByTestId('xp')).toHaveTextContent('10');

    await user.click(within(slot).getByRole('link', { name: 'Open quest →' }));
    await user.click(await screen.findByRole('button', { name: /Defeat boss/ }));
    expect(screen.getByText('“Signed offer from a tech lead”')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Yes, it's true/ }));

    expect(await screen.findByText('Slot 1 is open')).toBeInTheDocument();
    expect(screen.getByTestId('xp')).toHaveTextContent('110');
    expect(game().quests[0]!.status).toBe('finished');
  });

  it('blocks a third activation and offers finish, kill or override', async () => {
    seed({ id: 'a', title: 'Alpha', active: true }, { id: 'b', title: 'Beta', active: true }, { id: 'c', title: 'Gamma' });
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/Board locked/)).toBeInTheDocument();
    await goTo('#/vault');

    const card = await screen.findByRole('listitem', { name: 'Vault quest: Gamma' });
    await user.click(within(card).getByRole('button', { name: /Activate/ }));
    const dialog = screen.getByRole('dialog', { name: 'Finish or kill a quest first' });
    expect(within(dialog).getByRole('button', { name: /Alpha/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Beta/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Activate quest' })).not.toBeInTheDocument();
    expect(game().quests.filter((q) => q.status === 'active')).toHaveLength(2);

    // emergency override warns and then forces the quest in
    await user.click(within(dialog).getByRole('button', { name: 'Emergency override' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/streak resets to 0/);
    await user.click(screen.getByRole('button', { name: 'Override and activate' }));
    expect(game().quests.filter((q) => q.status === 'active')).toHaveLength(3);
    expect(game().events.map((e) => e.type)).toEqual(['OVERRIDE_USED', 'STREAK_RESET']);
  });

  it('kill requires a reason and telling the people involved', async () => {
    seed({ id: 'a', title: 'Alpha', active: true });
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/quest/a');

    await user.click(await screen.findByRole('button', { name: 'Kill quest' }));
    const confirm = screen.getByRole('button', { name: /Kill quest \(\+30 XP\)/ });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText('Why are you stopping?'), 'Superseded by the platform rewrite');
    expect(confirm).toBeDisabled();
    await user.click(screen.getByLabelText('I told the people involved.'));
    await user.click(confirm);

    expect(await screen.findByText('Slot 1 is open')).toBeInTheDocument();
    expect(screen.getByTestId('xp')).toHaveTextContent('30');
    expect(game().quests[0]).toMatchObject({ status: 'killed', killReason: 'Superseded by the platform rewrite' });
  });

  it('shows rule errors to the player', async () => {
    seed({ id: 'a', title: 'Alpha', active: true });
    for (const t of ['one', 'two', 'three']) useGame.getState().dispatch({ type: 'addLeadAction', questId: 'a', text: t });
    const user = userEvent.setup();
    render(<App />);
    const slot = screen.getByRole('article', { name: 'Quest: Alpha' });
    // add field disappears at the weekly limit
    expect(within(slot).queryByLabelText('New lead action for Alpha')).not.toBeInTheDocument();

    await goTo('#/quest/a');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Boss'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/needs a boss/);
  });
});
