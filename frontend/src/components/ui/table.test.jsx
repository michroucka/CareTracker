import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PeopleTable } from '@/test/table';

const row = (name) => screen.getByRole('row', { name });
const actionsButton = (name) => screen.getByRole('button', { name: `Akce pro ${name}` });

function renderTable(props) {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const result = render(<PeopleTable onOpen={onOpen} {...props} />);
    return { user, onOpen, ...result };
}

async function tabIntoTable(user) {
    await user.click(screen.getByRole('button', { name: 'Před tabulkou' }));
    await user.tab();
}

describe('Table – roving tabindex', () => {
    it('keeps the rows as a single Tab stop, entering on the first row and leaving after it', async () => {
        const { user } = renderTable();

        await tabIntoTable(user);
        expect(row('Marie Nová')).toHaveFocus();

        await user.tab();
        expect(screen.getByRole('button', { name: 'Za tabulkou' })).toHaveFocus();
    });

    it('keeps the row actions out of the Tab order', () => {
        renderTable();

        expect(actionsButton('Marie Nová')).toHaveAttribute('tabindex', '-1');
        expect(row('Karel Starý')).toHaveAttribute('tabindex', '-1');
    });

    it('moves between rows with the arrow keys, Home and End', async () => {
        const { user } = renderTable();
        await tabIntoTable(user);

        await user.keyboard('{ArrowDown}');
        expect(row('Karel Starý')).toHaveFocus();

        await user.keyboard('{End}');
        expect(row('Eva Malá')).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        expect(row('Eva Malá')).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(row('Karel Starý')).toHaveFocus();

        await user.keyboard('{Home}');
        expect(row('Marie Nová')).toHaveFocus();
    });

    it('enters the table again on the last active row', async () => {
        const { user } = renderTable();
        await tabIntoTable(user);
        await user.keyboard('{ArrowDown}{ArrowDown}');

        await user.tab();
        await user.tab({ shift: true });

        expect(row('Eva Malá')).toHaveFocus();
        expect(row('Marie Nová')).toHaveAttribute('tabindex', '-1');
    });

    it('makes a clicked row the active one', async () => {
        const { user } = renderTable();

        await user.click(screen.getByText('Karel Starý'));
        await user.click(screen.getByRole('button', { name: 'Před tabulkou' }));
        await user.tab();

        expect(row('Karel Starý')).toHaveFocus();
    });

    it('moves to the row actions with → and back to the row with ←', async () => {
        const { user } = renderTable();
        await tabIntoTable(user);
        await user.keyboard('{ArrowDown}');

        await user.keyboard('{ArrowRight}');
        expect(actionsButton('Karel Starý')).toHaveFocus();

        await user.keyboard('{ArrowLeft}');
        expect(row('Karel Starý')).toHaveFocus();
    });

    it('opens the row actions menu with Enter without opening the detail', async () => {
        const { user, onOpen } = renderTable();
        await tabIntoTable(user);
        await user.keyboard('{ArrowRight}{Enter}');

        expect(await screen.findByRole('menuitem', { name: 'Otevřít detail' })).toBeInTheDocument();
        expect(onOpen).not.toHaveBeenCalled();
    });

    it('opens the detail of the focused row with Enter or Space', async () => {
        const { user, onOpen } = renderTable();
        await tabIntoTable(user);

        await user.keyboard('{ArrowDown}{Enter}');
        expect(onOpen).toHaveBeenLastCalledWith('Karel Starý');

        await user.keyboard('{ArrowDown} ');
        expect(onOpen).toHaveBeenLastCalledWith('Eva Malá');
        expect(onOpen).toHaveBeenCalledTimes(2);
    });

    it('opens the detail on click, but not from the actions cell', async () => {
        const { user, onOpen } = renderTable();

        await user.click(screen.getByText('Eva Malá'));
        expect(onOpen).toHaveBeenCalledWith('Eva Malá');

        await user.click(actionsButton('Marie Nová'));
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('leaves rows without a detail out of the navigation', () => {
        renderTable();

        const headerRow = screen.getAllByRole('row')[0];
        expect(headerRow).not.toHaveAttribute('tabindex');
        expect(headerRow).not.toHaveAttribute('data-interactive');
    });

    it('keeps one row tabbable after the active row disappears (paging, filtering)', async () => {
        const { user, rerender } = renderTable();
        await tabIntoTable(user);
        await user.keyboard('{End}');

        rerender(<PeopleTable people={['Marie Nová', 'Karel Starý', 'Petr Nový']} />);

        await waitFor(() => expect(row('Marie Nová')).toHaveAttribute('tabindex', '0'));
        expect(row('Petr Nový')).toHaveAttribute('tabindex', '-1');
        expect(actionsButton('Petr Nový')).toHaveAttribute('tabindex', '-1');
    });
});

describe('Table – empty state', () => {
    it('shows the empty state across the table with no interactive rows', () => {
        renderTable({ people: [] });

        const [, emptyRow] = screen.getAllByRole('row');
        expect(within(emptyRow).getByText('Žádní klienti')).toBeInTheDocument();
        expect(within(emptyRow).getByText('Zkuste jiný filtr.')).toBeInTheDocument();
        expect(within(emptyRow).getByRole('cell')).toHaveAttribute('colspan', '2');
        expect(emptyRow).not.toHaveAttribute('tabindex');
    });

    it('lets Tab pass over an empty table', async () => {
        const { user } = renderTable({ people: [] });

        await tabIntoTable(user);

        expect(screen.getByRole('button', { name: 'Za tabulkou' })).toHaveFocus();
    });
});
