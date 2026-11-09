import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';

const calendarDay = (date) => screen.getByRole('button', { name: new RegExp(`^${date}`) });

function renderDatePicker(props) {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker aria-label="Datum narození" onChange={onChange} {...props} />);
    return { user, onChange };
}

describe('DatePicker', () => {
    it('shows the placeholder without a value and the Czech date with one', () => {
        const { unmount } = render(<DatePicker aria-label="Datum" onChange={() => {}} placeholder="Zvolte den" />);
        expect(screen.getByRole('button', { name: 'Datum' })).toHaveTextContent('Zvolte den');
        unmount();

        render(<DatePicker aria-label="Datum" value="2026-11-08" onChange={() => {}} />);
        expect(screen.getByRole('button', { name: 'Datum' })).toHaveTextContent('8. 11. 2026');
    });

    it('picks a day from the calendar as an ISO date and closes', async () => {
        const { user, onChange } = renderDatePicker({ value: '2026-11-08' });

        await user.click(screen.getByRole('button', { name: 'Datum narození' }));
        await user.click(calendarDay('neděle, 15. listopadu 2026'));

        expect(onChange).toHaveBeenCalledWith('2026-11-15');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('works from the keyboard', async () => {
        const { user, onChange } = renderDatePicker({ value: '2026-11-08' });

        screen.getByRole('button', { name: 'Datum narození' }).focus();
        await user.keyboard('{Enter}');

        expect(calendarDay('neděle, 8. listopadu 2026')).toHaveFocus();

        await user.keyboard('{ArrowRight}{Enter}');

        expect(onChange).toHaveBeenCalledWith('2026-11-09');
    });

    it('does not allow days outside minDate and maxDate', async () => {
        const { user, onChange } = renderDatePicker({ value: '2026-11-08', minDate: '2026-11-05', maxDate: '2026-11-20' });

        await user.click(screen.getByRole('button', { name: 'Datum narození' }));

        expect(calendarDay('středa, 4. listopadu 2026')).toBeDisabled();
        expect(calendarDay('čtvrtek, 5. listopadu 2026')).toBeEnabled();
        expect(calendarDay('pátek, 20. listopadu 2026')).toBeEnabled();
        expect(calendarDay('sobota, 21. listopadu 2026')).toBeDisabled();

        await user.click(calendarDay('sobota, 21. listopadu 2026'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('opens on the maxDate month when empty', async () => {
        const { user } = renderDatePicker({ maxDate: '2020-03-15' });

        await user.click(screen.getByRole('button', { name: 'Datum narození' }));

        expect(calendarDay('neděle, 15. března 2020')).toBeEnabled();
    });

    it('cannot be opened when disabled', () => {
        renderDatePicker({ disabled: true });

        expect(screen.getByRole('button', { name: 'Datum narození' })).toBeDisabled();
    });
});
