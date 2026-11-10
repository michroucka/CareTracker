import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DayFilter } from './DayFilter';

const NOVEMBER_2026 = { year: 2026, month: 10 };
const DAYS_WITH_RECORDS = ['2026-11-03', '2026-11-10', '2026-11-24'];

function StatefulDayFilter({ initialValue = '', onChange = () => {}, days = DAYS_WITH_RECORDS, ...props }) {
    const [value, setValue] = useState(initialValue);
    const change = (day) => {
        setValue(day);
        onChange(day);
    };
    return <DayFilter period={NOVEMBER_2026} days={days} value={value} onChange={change} {...props} />;
}

function renderDayFilter(props) {
    const user = userEvent.setup();
    render(<StatefulDayFilter {...props} />);
    return { user };
}

const dayTrigger = () => screen.getByRole('button', { name: /^Den:/ });
// a selected day's label gets a locale suffix ("vybráno"), so match the date at the start
const calendarDay = (date) => screen.getByRole('button', { name: new RegExp(`^${date}`) });

describe('DayFilter', () => {
    // outside the tested month, otherwise the calendar renames and focuses today
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(new Date(2026, 11, 15)));
    afterEach(() => vi.useRealTimers());

    it('shows the whole month until a day is picked', () => {
        renderDayFilter();

        expect(dayTrigger()).toHaveTextContent('Den:Všechny');
        expect(screen.queryByRole('button', { name: 'Zobrazit celý měsíc' })).not.toBeInTheDocument();
    });

    it('lets the user pick only days that have records', async () => {
        const onChange = vi.fn();
        const { user } = renderDayFilter({ onChange });

        await user.click(dayTrigger());

        expect(calendarDay('úterý, 3. listopadu 2026')).toBeEnabled();
        expect(calendarDay('úterý, 10. listopadu 2026')).toBeEnabled();
        expect(calendarDay('středa, 4. listopadu 2026')).toBeDisabled();
        expect(calendarDay('neděle, 1. listopadu 2026')).toBeDisabled();

        await user.click(calendarDay('úterý, 10. listopadu 2026'));

        expect(onChange).toHaveBeenCalledWith('2026-11-10');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(dayTrigger()).toHaveTextContent('út 10. 11.');
    });

    it('moves the keyboard focus only between days with records', async () => {
        const onChange = vi.fn();
        const { user } = renderDayFilter({ onChange });

        dayTrigger().focus();
        await user.keyboard('{Enter}');

        expect(calendarDay('úterý, 3. listopadu 2026')).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        expect(calendarDay('úterý, 10. listopadu 2026')).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        expect(calendarDay('úterý, 24. listopadu 2026')).toHaveFocus();

        await user.keyboard('{ArrowLeft}{Enter}');
        expect(onChange).toHaveBeenCalledWith('2026-11-10');
    });

    it('focuses the selected day when reopened', async () => {
        const { user } = renderDayFilter({ initialValue: '2026-11-24' });

        await user.click(dayTrigger());

        expect(calendarDay('úterý, 24. listopadu 2026')).toHaveFocus();
    });

    it('steps to the previous and next day with records using the arrow buttons', async () => {
        const onChange = vi.fn();
        const { user } = renderDayFilter({ initialValue: '2026-11-10', onChange });

        await user.click(screen.getByRole('button', { name: 'Další den se záznamy' }));
        expect(onChange).toHaveBeenLastCalledWith('2026-11-24');
        expect(screen.getByRole('button', { name: 'Další den se záznamy' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Předchozí den se záznamy' }));
        await user.click(screen.getByRole('button', { name: 'Předchozí den se záznamy' }));
        expect(onChange).toHaveBeenLastCalledWith('2026-11-03');
        expect(screen.getByRole('button', { name: 'Předchozí den se záznamy' })).toBeDisabled();
    });

    it('returns to the whole month with the clear button', async () => {
        const onChange = vi.fn();
        const { user } = renderDayFilter({ initialValue: '2026-11-10', onChange });

        await user.click(screen.getByRole('button', { name: 'Zobrazit celý měsíc' }));

        expect(onChange).toHaveBeenCalledWith('');
        expect(dayTrigger()).toHaveTextContent('Den:Všechny');
        expect(screen.queryByRole('button', { name: 'Předchozí den se záznamy' })).not.toBeInTheDocument();
    });

    it('cannot be opened when the month has no records', () => {
        renderDayFilter({ days: [] });

        expect(dayTrigger()).toBeDisabled();
    });

    it('cannot be opened when disabled', () => {
        renderDayFilter({ isDisabled: true });

        expect(dayTrigger()).toBeDisabled();
    });
});
