import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from './PasswordInput';

function PasswordWithConfirmation() {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <>
            <label htmlFor="password">Heslo</label>
            <PasswordInput id="password" isVisible={isVisible} onVisibleChange={setIsVisible} />
            <label htmlFor="confirmation">Heslo znovu</label>
            <PasswordInput id="confirmation" isVisible={isVisible} onVisibleChange={setIsVisible} />
        </>
    );
}

describe('PasswordInput', () => {
    it('hides the password until the user asks to show it', async () => {
        const user = userEvent.setup();
        render(<><label htmlFor="password">Heslo</label><PasswordInput id="password" /></>);
        const input = screen.getByLabelText('Heslo');

        await user.type(input, 'tajne123');
        expect(input).toHaveAttribute('type', 'password');
        expect(input).toHaveValue('tajne123');

        const toggle = screen.getByRole('button', { name: 'Zobrazit heslo' });
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await user.click(toggle);

        expect(input).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: 'Skrýt heslo' })).toHaveAttribute('aria-pressed', 'true');

        await user.click(screen.getByRole('button', { name: 'Skrýt heslo' }));
        expect(input).toHaveAttribute('type', 'password');
    });

    it('toggles from the keyboard without submitting the form', async () => {
        const user = userEvent.setup();
        let submitted = false;
        render(
            <form onSubmit={(event) => { event.preventDefault(); submitted = true; }}>
                <label htmlFor="password">Heslo</label>
                <PasswordInput id="password" />
            </form>,
        );

        await user.click(screen.getByLabelText('Heslo'));
        await user.tab();
        expect(screen.getByRole('button', { name: 'Zobrazit heslo' })).toHaveFocus();
        await user.keyboard('{Enter}');

        expect(screen.getByLabelText('Heslo')).toHaveAttribute('type', 'text');
        expect(submitted).toBe(false);
    });

    it('shares the visibility between the password and its confirmation', async () => {
        const user = userEvent.setup();
        render(<PasswordWithConfirmation />);

        await user.click(screen.getAllByRole('button', { name: 'Zobrazit heslo' })[0]);

        expect(screen.getByLabelText('Heslo')).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Heslo znovu')).toHaveAttribute('type', 'text');
    });

    it('disables the input and the toggle together', () => {
        render(<><label htmlFor="password">Heslo</label><PasswordInput id="password" disabled /></>);

        expect(screen.getByLabelText('Heslo')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Zobrazit heslo' })).toBeDisabled();
    });
});
