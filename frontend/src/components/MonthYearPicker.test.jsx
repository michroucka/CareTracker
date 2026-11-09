import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MonthYearPicker from './MonthYearPicker';

function StatefulMonthYearPicker({ initialValue, onChange, ...props }) {
    const [value, setValue] = useState(initialValue);
    const change = (next) => {
        setValue(next);
        onChange(next);
    };
    return <MonthYearPicker value={value} onChange={change} {...props} />;
}

function renderMonthYearPicker(initialValue, props) {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatefulMonthYearPicker initialValue={initialValue} onChange={onChange} {...props} />);
    return { user, onChange };
}

const monthTrigger = (label) => screen.getByRole('button', { name: label });

describe('MonthYearPicker', () => {
    beforeEach(() => {
        // only Date is faked, so user-event timers keep working
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 10, 9));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('steps months with the arrows across a year boundary', async () => {
        const { user, onChange } = renderMonthYearPicker({ month: 0, year: 2026 });

        await user.click(screen.getByRole('button', { name: 'Předchozí měsíc' }));

        expect(onChange).toHaveBeenCalledWith({ month: 11, year: 2025 });
        expect(monthTrigger('Prosinec 2025')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Další měsíc' }));
        expect(monthTrigger('Leden 2026')).toBeInTheDocument();
    });

    it('does not go past the current month', () => {
        renderMonthYearPicker({ month: 10, year: 2026 });

        expect(screen.getByRole('button', { name: 'Další měsíc' })).toBeDisabled();
    });

    it('does not go before the first supported month', () => {
        renderMonthYearPicker({ month: 0, year: 1970 });

        expect(screen.getByRole('button', { name: 'Předchozí měsíc' })).toBeDisabled();
    });

    it('marks the selected month in the popover and focuses it', async () => {
        const { user } = renderMonthYearPicker({ month: 2, year: 2026 });

        await user.click(monthTrigger('Březen 2026'));

        const march = screen.getByRole('button', { name: 'Březen 2026' , pressed: true });
        expect(march).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Duben 2026' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('disables future months', async () => {
        const { user } = renderMonthYearPicker({ month: 2, year: 2026 });

        await user.click(monthTrigger('Březen 2026'));

        expect(screen.getByRole('button', { name: 'Listopad 2026' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Prosinec 2026' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Další rok' })).toBeDisabled();
    });

    it('picks a month of another year and closes', async () => {
        const { user, onChange } = renderMonthYearPicker({ month: 2, year: 2026 });

        await user.click(monthTrigger('Březen 2026'));
        await user.click(screen.getByRole('button', { name: 'Předchozí rok' }));
        await user.click(screen.getByRole('button', { name: 'Červenec 2025' }));

        expect(onChange).toHaveBeenCalledWith({ month: 6, year: 2025 });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(monthTrigger('Červenec 2025')).toBeInTheDocument();
    });

    it('shows the year of the value again after reopening', async () => {
        const { user } = renderMonthYearPicker({ month: 2, year: 2026 });

        await user.click(monthTrigger('Březen 2026'));
        await user.click(screen.getByRole('button', { name: 'Předchozí rok' }));
        await user.keyboard('{Escape}');
        await user.click(monthTrigger('Březen 2026'));

        expect(screen.getByRole('button', { name: 'Březen 2026', pressed: true })).toBeInTheDocument();
    });

    it('disables everything when isDisabled', () => {
        renderMonthYearPicker({ month: 2, year: 2026 }, { isDisabled: true });

        expect(screen.getByRole('button', { name: 'Předchozí měsíc' })).toBeDisabled();
        expect(monthTrigger('Březen 2026')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Další měsíc' })).toBeDisabled();
    });
});
