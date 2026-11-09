import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { PeopleWithDetail } from '@/test/table';
import { RecordSheet } from './RecordSheet';

const row = (name) => screen.getByRole('row', { name });

async function openDetailFromKeyboard(user, name) {
    row(name).focus();
    await user.keyboard('{Enter}');
    return screen.findByRole('dialog', { name });
}

describe('RecordSheet', () => {
    it('opens the detail of the row as a dialog', async () => {
        const user = userEvent.setup();
        render(<PeopleWithDetail />);

        await user.click(screen.getByText('Karel Starý'));

        const sheet = await screen.findByRole('dialog', { name: 'Karel Starý' });
        expect(sheet).toHaveTextContent('Klient');
        expect(sheet).toHaveTextContent('Detail klienta');
    });

    it('closes on Escape and gives the focus back to the row that opened it', async () => {
        const user = userEvent.setup();
        render(<PeopleWithDetail />);
        await openDetailFromKeyboard(user, 'Eva Malá');

        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(row('Eva Malá')).toHaveFocus();
    });

    it('closes with the close button and gives the focus back to the row', async () => {
        const user = userEvent.setup();
        render(<PeopleWithDetail />);
        await openDetailFromKeyboard(user, 'Karel Starý');

        await user.click(screen.getByRole('button', { name: 'Zavřít' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(row('Karel Starý')).toHaveFocus();
    });

    it('keeps the row active, so Tab enters the table on it after closing', async () => {
        const user = userEvent.setup();
        render(<PeopleWithDetail />);
        await openDetailFromKeyboard(user, 'Eva Malá');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        await user.tab();
        await user.tab({ shift: true });

        expect(row('Eva Malá')).toHaveFocus();
    });

    it('does not fail on closing when the opening row is gone', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<PeopleWithDetail />);
        await openDetailFromKeyboard(user, 'Eva Malá');

        rerender(<PeopleWithDetail people={['Marie Nová']} />);
        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('shows a loading state without the title and actions', () => {
        render(<RecordSheet open isLoading title="Marie Nová" onEdit={() => {}} onOpenChange={() => {}} />);

        expect(screen.getByRole('dialog', { name: 'Načítám…' })).toBeInTheDocument();
        expect(screen.getByRole('status', { name: 'Načítání' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();
    });

    it('offers edit and the "⋯" actions in view mode', async () => {
        const user = userEvent.setup();
        const onEdit = vi.fn();
        const onTerminate = vi.fn();
        render(
            <RecordSheet
                open
                onOpenChange={() => {}}
                title="Marie Nová"
                onEdit={onEdit}
                moreActions={<DropdownMenuItem onSelect={onTerminate}>Deaktivovat</DropdownMenuItem>}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Upravit/ }));
        expect(onEdit).toHaveBeenCalledOnce();

        await user.click(screen.getByRole('button', { name: 'Další akce' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Deaktivovat' }));
        expect(onTerminate).toHaveBeenCalledOnce();
    });

    it('replaces the view actions with its own footer while editing', () => {
        render(
            <RecordSheet
                open
                onOpenChange={() => {}}
                title="Marie Nová"
                onEdit={() => {}}
                footer={<button type="button">Uložit</button>}
            />,
        );

        expect(screen.getByRole('button', { name: 'Uložit' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();
    });
});
