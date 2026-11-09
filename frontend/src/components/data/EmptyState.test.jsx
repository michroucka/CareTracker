import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table, TableBody } from '@/components/ui/table';
import { EmptyState, TableEmptyRow } from './EmptyState';

describe('EmptyState', () => {
    it('shows the title, description and action', () => {
        render(
            <EmptyState
                title="Zatím žádní klienti"
                description="Přidejte prvního klienta."
                action={<button type="button">Nový klient</button>}
            />,
        );

        expect(screen.getByText('Zatím žádní klienti')).toBeInTheDocument();
        expect(screen.getByText('Přidejte prvního klienta.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Nový klient' })).toBeInTheDocument();
    });

    it('hides the decorative symbol from assistive technology', () => {
        const { container } = render(<EmptyState title="Nic tu není" />);

        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders only the title when nothing else is given', () => {
        const { container } = render(<EmptyState title="Nic tu není" />);

        expect(container.querySelectorAll('p')).toHaveLength(1);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('spans all table columns in an empty table row', () => {
        render(
            <Table>
                <TableBody>
                    <TableEmptyRow columnCount={5} title="Žádné úkony" />
                </TableBody>
            </Table>,
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('colspan', '5');
        expect(cell).toHaveTextContent('Žádné úkony');
    });
});
