import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from './Combobox';

const CAREGIVERS = [
    { value: 1, label: 'Jana Nováková', description: 'Plzeň' },
    { value: 2, label: 'Petr Svoboda', description: 'Klatovy' },
    { value: 3, label: 'Eva Černá' },
];

function renderCombobox(props) {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox aria-label="Pečovatel" options={CAREGIVERS} value={null} onChange={onChange} {...props} />);
    return { user, onChange, trigger: screen.getByRole('combobox', { name: 'Pečovatel' }) };
}

describe('Combobox', () => {
    it('shows the placeholder or the label of the selected option', () => {
        const { unmount } = render(<Combobox aria-label="Pečovatel" options={CAREGIVERS} value={null} onChange={() => {}} placeholder="Vyberte pečovatele" />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Vyberte pečovatele');
        unmount();

        render(<Combobox aria-label="Pečovatel" options={CAREGIVERS} value={2} onChange={() => {}} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Petr Svoboda');
    });

    it('opens a list of options and selects one', async () => {
        const { user, onChange, trigger } = renderCombobox();

        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await user.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        expect(screen.getAllByRole('option')).toHaveLength(3);
        await user.click(screen.getByRole('option', { name: /Petr Svoboda/ }));

        expect(onChange).toHaveBeenCalledWith(2);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('filters by label and description ignoring diacritics and case', async () => {
        const { user, trigger } = renderCombobox({ searchPlaceholder: 'Hledat pečovatele' });

        await user.click(trigger);
        await user.type(screen.getByPlaceholderText('Hledat pečovatele'), 'cerna');
        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Eva Černá']);

        await user.clear(screen.getByPlaceholderText('Hledat pečovatele'));
        await user.type(screen.getByPlaceholderText('Hledat pečovatele'), 'PLZEN');
        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Jana NovákováPlzeň']);
    });

    it('shows the empty text when nothing matches', async () => {
        const { user, trigger } = renderCombobox({ emptyText: 'Žádný pečovatel' });

        await user.click(trigger);
        await user.type(screen.getByRole('combobox', { name: '' }), 'xyz');

        expect(screen.queryByRole('option')).not.toBeInTheDocument();
        expect(screen.getByText('Žádný pečovatel')).toBeInTheDocument();
    });

    it('selects with the keyboard', async () => {
        const { user, onChange, trigger } = renderCombobox();

        trigger.focus();
        await user.keyboard('{Enter}');
        await user.keyboard('{ArrowDown}{Enter}');

        expect(onChange).toHaveBeenCalledWith(2);
    });

    it('clears the value with the clear option', async () => {
        const { user, onChange, trigger } = renderCombobox({ value: 1, clearLabel: 'Bez pečovatele' });

        await user.click(trigger);
        await user.click(screen.getByRole('option', { name: /Bez pečovatele/ }));

        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('cannot be opened when disabled', () => {
        const { trigger } = renderCombobox({ disabled: true });

        expect(trigger).toBeDisabled();
    });
});
