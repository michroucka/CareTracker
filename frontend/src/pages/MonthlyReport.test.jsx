import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MonthlyReport from './MonthlyReport';
import { formatCurrency } from '@/components/dashboard/dashboardFormat';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { currentSearchParams, serveAndRecord } from '@/test/hooks';
import { client } from '@/test/users';

const CLIENT_ID = 20;

const shopping = {
    id: 100,
    date: '2026-11-03T09:30:00',
    clientName: 'Karel Klient',
    taskName: 'Nákup',
    unitCount: 2,
    unitType: 'OCCURRENCE',
    price: 200,
    caregivers: [{ id: 10, fullName: 'Jana Testová' }],
};

const escort = {
    id: 101,
    date: '2026-11-05T14:00:00',
    clientName: 'Karel Klient',
    taskName: 'Doprovod',
    unitCount: 90,
    unitType: 'HOUR',
    price: 195,
    caregivers: [{ id: 11, fullName: 'Petr Svoboda' }],
};

const shoppingDetail = {
    id: 100,
    date: '2026-11-03T09:30:00',
    unitCount: 2,
    notes: 'Mléko a chleba',
    task: { id: 1, name: 'Nákup', unitType: 'OCCURRENCE', unitPrice: 100 },
    client: { id: CLIENT_ID, fullName: 'Karel Klient' },
    caregivers: [{ id: 10, fullName: 'Jana Testová' }],
    department: { id: 2, city: 'Plzeň' },
};

// Testing Library collapses the no-break space in "395 Kč" when it reads the page, but not in the expected text
const price = (value) => formatCurrency(value).replace(/\s/g, ' ');

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const QR_OBJECT_URL = 'blob:payment-qr';

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 9, 10, 2));
    // jsdom has no object URLs; they stay stubbed after the test because the QR dialog revokes its URL on unmount
    URL.createObjectURL = vi.fn(() => QR_OBJECT_URL);
    URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
    vi.useRealTimers();
});

/** November has two records, other months none. */
function serveMonths(recordsByMonth = { 11: [shopping, escort] }) {
    return serveAndRecord('get', '/performed-tasks', ({ request }) => {
        const month = new URL(request.url).searchParams.get('month');
        return HttpResponse.json(recordsByMonth[month] ?? []);
    });
}

function renderReport(route = '/monthly-report') {
    return renderWithProviders(<MonthlyReport />, { authStatus: client({ clientId: CLIENT_ID }), route });
}

const summaryTile = (label) => screen.getByText(label).parentElement;

describe('MonthlyReport', () => {
    it("shows the client's records and totals for the current month", async () => {
        const requests = serveMonths();

        renderReport();

        expect(await screen.findByRole('row', { name: /Nákup/ })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: /Doprovod/ })).toHaveTextContent('Petr Svoboda');
        expect(Object.fromEntries(requests.at(-1).searchParams)).toEqual({ clientId: String(CLIENT_ID), month: '11', year: '2026' });

        expect(summaryTile('Úkony')).toHaveTextContent('2');
        expect(summaryTile('K úhradě')).toHaveTextContent(price(395));
        expect(screen.getByText(/2 úkony · celkem/)).toHaveTextContent(price(395));
    });

    it('switches months and keeps the month in the URL', async () => {
        const requests = serveMonths();
        const { user } = renderReport();
        await screen.findByRole('row', { name: /Nákup/ });

        expect(screen.getByRole('button', { name: 'Další měsíc' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Předchozí měsíc' }));

        expect(await screen.findByText('V tomto měsíci bez péče')).toBeInTheDocument();
        expect(requests.at(-1).searchParams.get('month')).toBe('10');
        expect(currentSearchParams().get('month')).toBe('10');
        expect(screen.getByRole('button', { name: 'Říjen 2026' })).toBeInTheDocument();
    });

    it('opens the month from the URL', async () => {
        const requests = serveMonths({ 9: [{ ...shopping, date: '2026-09-14T08:00:00' }] });

        renderReport('/monthly-report?month=9&year=2026');

        expect(await screen.findByRole('row', { name: /Nákup/ })).toBeInTheDocument();
        expect(requests.at(-1).searchParams.get('month')).toBe('9');
        expect(summaryTile('K úhradě')).toHaveTextContent(price(200));
    });

    it('shows an empty month without a total or payment', async () => {
        serveMonths({});

        renderReport();

        expect(await screen.findByText('V tomto měsíci bez péče')).toBeInTheDocument();
        expect(summaryTile('Úkony')).toHaveTextContent('0');
        expect(summaryTile('K úhradě')).toHaveTextContent(price(0));
        expect(screen.queryByRole('button', { name: /QR platba/ })).not.toBeInTheDocument();
        expect(screen.queryByText(/celkem/)).not.toBeInTheDocument();
    });

    it('shows the payment QR code for the month', async () => {
        serveMonths();
        const qrRequests = serveAndRecord('get', '/performed-tasks/payment-qr', () => new HttpResponse(PNG_BYTES, { headers: { 'Content-Type': 'image/png' } }));
        const { user } = renderReport();
        await screen.findByRole('row', { name: /Nákup/ });

        await user.click(screen.getByRole('button', { name: /QR platba/ }));

        const dialog = screen.getByRole('dialog', { name: 'QR platba' });
        expect(dialog).toHaveTextContent(`Listopad 2026: ${price(395)}`);
        expect(await within(dialog).findByAltText(`QR kód pro platbu ${price(395)}`)).toHaveAttribute('src', QR_OBJECT_URL);
        expect(Object.fromEntries(qrRequests[0].searchParams)).toEqual({ clientId: String(CLIENT_ID), month: '11', year: '2026' });
    });

    it('does not show a QR code when the organization has no bank account (204)', async () => {
        serveMonths();
        server.use(http.get(apiUrl('/performed-tasks/payment-qr'), () => new HttpResponse(null, { status: 204 })));
        const { user } = renderReport();
        await screen.findByRole('row', { name: /Nákup/ });

        await user.click(screen.getByRole('button', { name: /QR platba/ }));

        await waitFor(() => expect(screen.queryByLabelText('Načítání QR kódu')).not.toBeInTheDocument());
        expect(screen.queryByRole('img', { name: /QR kód pro platbu/ })).not.toBeInTheDocument();
        expect(screen.getByText(/organizace nemá nastavený bankovní účet/)).toBeInTheDocument();
    });

    it('closes the QR dialog when the code cannot be loaded', async () => {
        serveMonths();
        server.use(http.get(apiUrl('/performed-tasks/payment-qr'), () => HttpResponse.json({ message: 'Chyba' }, { status: 502 })));
        const { user } = renderReport();
        await screen.findByRole('row', { name: /Nákup/ });

        await user.click(screen.getByRole('button', { name: /QR platba/ }));

        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'QR platba' })).not.toBeInTheDocument());
    });

    it('opens a read-only detail of a record', async () => {
        serveMonths();
        server.use(http.get(apiUrl('/performed-tasks/100'), () => HttpResponse.json(shoppingDetail)));
        const { user } = renderReport();

        await user.click(await screen.findByRole('row', { name: /Nákup/ }));

        expect(currentSearchParams().get('detail')).toBe('100');
        const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
        expect(await within(sheet).findByText('Mléko a chleba')).toBeInTheDocument();
        expect(within(sheet).queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();
        expect(within(sheet).queryByRole('link', { name: /Otevřít detail klienta/ })).not.toBeInTheDocument();
    });
});
