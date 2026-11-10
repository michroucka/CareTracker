import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField } from './FormField';

function renderField(props) {
    return render(
        <FormField id="firstName" label="Jméno" {...props}>
            {(controlProps) => <input {...controlProps} />}
        </FormField>,
    );
}

describe('FormField', () => {
    it('labels the control', () => {
        renderField();

        const input = screen.getByRole('textbox', { name: 'Jméno' });
        expect(input).toHaveAttribute('id', 'firstName');
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input).not.toHaveAttribute('aria-required');
    });

    it('marks a required field without reading the asterisk aloud', () => {
        renderField({ required: true });

        const input = screen.getByRole('textbox', { name: 'Jméno' });
        expect(input).toBeRequired();
        expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    });

    it('describes the control with the hint', () => {
        renderField({ hint: 'Tak, jak je v občanském průkazu.' });

        const input = screen.getByRole('textbox', { name: 'Jméno' });
        expect(input).toHaveAccessibleDescription('Tak, jak je v občanském průkazu.');
        expect(input).toHaveAttribute('aria-describedby', 'firstName-hint');
    });

    it('marks the control invalid and describes it with the error instead of the hint', () => {
        renderField({ hint: 'Tak, jak je v občanském průkazu.', error: 'Vyplňte jméno.' });

        const input = screen.getByRole('textbox', { name: 'Jméno' });
        expect(input).toBeInvalid();
        expect(input).toHaveAccessibleDescription('Vyplňte jméno.');
        expect(screen.queryByText('Tak, jak je v občanském průkazu.')).not.toBeInTheDocument();
    });

    it('is described by the new error at once, while the hint is still fading out', () => {
        const { rerender } = renderField({ hint: 'Tak, jak je v občanském průkazu.' });

        rerender(
            <FormField id="firstName" label="Jméno" hint="Tak, jak je v občanském průkazu." error="Vyplňte jméno.">
                {(controlProps) => <input {...controlProps} />}
            </FormField>,
        );

        expect(screen.getByRole('textbox', { name: 'Jméno' })).toHaveAccessibleDescription('Vyplňte jméno.');
    });

    it('clears the invalid state when the error is gone', () => {
        const { rerender } = renderField({ error: 'Vyplňte jméno.' });

        rerender(
            <FormField id="firstName" label="Jméno">
                {(controlProps) => <input {...controlProps} />}
            </FormField>,
        );

        const input = screen.getByRole('textbox', { name: 'Jméno' });
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
    });
});
