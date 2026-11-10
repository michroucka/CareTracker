import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientDetail } from './ClientDetail';
import { renderWithProviders } from '@/test/render';
import { serveAndRecord, serverError } from '@/test/hooks';
import { apiUrl, server } from '@/test/server';
import { admin, caregiver, coordinator } from '@/test/users';

const PLZEN = { id: 2, city: 'Plzeň' };

const MARIE = {
    id: 7,
    firstName: 'Marie',
    lastName: 'Nová',
    gender: 'FEMALE',
    dateOfBirth: '1940-03-15',
    personalNumber: 1234,
    legallyCompetent: true,
    street: 'Americká 12',
    city: 'Plzeň',
    postalCode: '30100',
    phone: '777123456',
    email: 'marie@example.cz',
    relativesContact: 'Dcera Jana, 603 111 222',
    generalPractitioner: null,
    notes: null,
    benefits: 'TWO',
    active: true,
    created: '2024-05-01',
    pictureId: null,
    latitude: null,
    longitude: null,
    department: PLZEN,
    caregiver: { id: 10, fullName: 'Jana Testová' },
    tasks: [{ id: 40, name: 'Nákup' }, { id: 41, name: 'Úklid' }],
    terminationDate: null,
    terminationReason: null,
};

const TERMINATED_MARIE = { ...MARIE, active: false, terminationDate: '2026-10-31', terminationReason: 'EXITUS' };

/** Serves the client from a variable, so a reload after an action shows what the server changed. */
function serveClient(initialClient) {
    let storedClient = initialClient;
    server.use(
        http.get(apiUrl('/clients/:id'), () => HttpResponse.json(storedClient)),
        http.get(apiUrl('/departments'), () => HttpResponse.json([PLZEN])),
        http.get(apiUrl('/employees'), () => HttpResponse.json([{ id: 10, firstName: 'Jana', lastName: 'Testová', department: PLZEN }])),
        http.get(apiUrl('/tasks'), () => HttpResponse.json([{ id: 40, name: 'Nákup' }, { id: 41, name: 'Úklid' }])),
    );
    const listReloads = serveAndRecord('get', '/clients', () => HttpResponse.json([]));
    return { listReloads, changeTo: (client) => { storedClient = client; } };
}

function renderDetail(authStatus = admin()) {
    return renderWithProviders(
        <Routes>
            <Route path="/clients/:clientId" element={<ClientDetail />} />
            <Route path="/clients" element={<h1>Seznam klientů</h1>} />
        </Routes>,
        { authStatus, route: '/clients/7' },
    );
}

const detailValue = (label) => screen.getByText(label, { selector: 'dt' }).nextElementSibling;

// the view fades out before the form appears
async function startEditing(user) {
    await user.click(await screen.findByRole('button', { name: /Upravit/ }));
    return screen.findByRole('button', { name: 'Uložit změny' });
}

async function openMoreActions(user) {
    await user.click(await screen.findByRole('button', { name: 'Další akce' }));
}

describe('ClientDetail – view', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(new Date(2026, 10, 9, 12)));
    afterEach(() => vi.useRealTimers());

    it("shows the client's data", async () => {
        serveClient(MARIE);

        renderDetail(caregiver());

        expect(await screen.findByRole('heading', { level: 1, name: 'Marie Nová' })).toBeInTheDocument();
        expect(screen.getByText('Aktivní')).toBeInTheDocument();
        expect(detailValue('Datum narození')).toHaveTextContent('15. 3. 1940 (86 let)');
        expect(detailValue('Pohlaví')).toHaveTextContent('Žena');
        expect(detailValue('Osobní číslo')).toHaveTextContent('1234');
        expect(detailValue('Svéprávný')).toHaveTextContent('Ano');
        expect(detailValue('Adresa')).toHaveTextContent('Americká 1230100 Plzeň');
        expect(screen.getByRole('link', { name: '777123456' })).toHaveAttribute('href', 'tel:777123456');
        expect(screen.getByRole('link', { name: 'marie@example.cz' })).toHaveAttribute('href', 'mailto:marie@example.cz');
        expect(detailValue('Kontakt na příbuzné')).toHaveTextContent('Dcera Jana, 603 111 222');
        expect(detailValue('Praktický lékař')).toHaveTextContent('–');
        expect(screen.getByText('Bez poznámek.')).toBeInTheDocument();
        expect(detailValue('Středisko')).toHaveTextContent('Plzeň');
        expect(detailValue('Klíčový pracovník')).toHaveTextContent('Jana Testová');
        expect(detailValue('Příspěvek na péči')).toHaveTextContent('II. stupeň');
        expect(screen.getByText('2 úkony')).toBeInTheDocument();
        expect(screen.getByText('Úklid')).toBeInTheDocument();
        expect(screen.queryByText('Ukončení smlouvy')).not.toBeInTheDocument();
    });

    it('shows when and why the contract of a terminated client ended', async () => {
        serveClient(TERMINATED_MARIE);

        renderDetail(caregiver());

        expect(await screen.findByText('Ukončení smlouvy')).toBeInTheDocument();
        expect(screen.getByText('Neaktivní')).toBeInTheDocument();
        expect(detailValue('Datum ukončení')).toHaveTextContent('31. 10. 2026');
        expect(detailValue('Důvod')).toHaveTextContent('Exitus');
    });

    it('says the client was not found and leads back to the list', async () => {
        serveClient(MARIE);
        server.use(http.get(apiUrl('/clients/:id'), serverError('Klient neexistuje', 404)));

        renderDetail();

        expect(await screen.findByText('Klient nebyl nalezen.')).toBeInTheDocument();
        expect(await screen.findByText('Klient nenalezen')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Zpět na klienty' })).toHaveAttribute('href', expect.stringMatching(/^\/clients/));
    });
});

describe('ClientDetail – actions by role', () => {
    it('lets a caregiver only open the individual plan', async () => {
        serveClient(MARIE);

        renderDetail(caregiver());

        expect(await screen.findByRole('link', { name: /Individuální plán/ })).toHaveAttribute('href', '/clients/7/individual-plan');
        expect(screen.queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Další akce' })).not.toBeInTheDocument();
    });

    it.each([
        ['coordinator', coordinator()],
        ['admin', admin()],
    ])('lets the %s edit and end the contract', async (_, authStatus) => {
        serveClient(MARIE);
        const { user } = renderDetail(authStatus);

        expect(await screen.findByRole('button', { name: /Upravit/ })).toBeInTheDocument();
        await openMoreActions(user);
        expect(screen.getByRole('menuitem', { name: /Ukončit smlouvu/ })).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: /Znovu aktivovat/ })).not.toBeInTheDocument();
    });
});

describe('ClientDetail – edit', () => {
    it('saves the changed fields and shows the saved client', async () => {
        serveClient(MARIE);
        const updates = serveAndRecord('put', '/clients/:id', ({ request }) => request.clone().json().then((body) => HttpResponse.json({ ...MARIE, ...body })));
        const { user } = renderDetail();

        await startEditing(user);
        expect(screen.getByRole('heading', { level: 1, name: 'Úprava klienta' })).toBeInTheDocument();
        expect(screen.getByLabelText(/^Jméno/)).toHaveValue('Marie');
        expect(screen.getByLabelText(/^PSČ/)).toHaveValue('301 00');
        expect(screen.getByLabelText(/^Telefon/)).toHaveValue('777 123 456');

        await user.clear(screen.getByLabelText(/^Telefon/));
        await user.type(screen.getByLabelText(/^Telefon/), '603999888');
        await user.type(screen.getByLabelText(/^Praktický lékař/), 'MUDr. Dvořák');
        await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

        await waitFor(() => expect(updates).toHaveLength(1));
        expect(updates[0].path).toMatch(/\/clients\/7$/);
        expect(updates[0].body).toMatchObject({
            firstName: 'Marie',
            phone: '603 999 888',
            generalPractitioner: 'MUDr. Dvořák',
            postalCode: '301 00',
            departmentId: 2,
            caregiverId: 10,
            taskIds: [40, 41],
            terminationDate: null,
            terminationReason: null,
        });
        expect(updates[0].body).not.toHaveProperty('picture');
        expect(await screen.findByRole('heading', { level: 1, name: 'Marie Nová' })).toBeInTheDocument();
        expect(await screen.findByRole('link', { name: '603 999 888' })).toBeInTheDocument();
        expect(screen.getByText('Klient úspěšně aktualizován')).toBeInTheDocument();
    });

    it('does not save an invalid form', async () => {
        serveClient(MARIE);
        const updates = serveAndRecord('put', '/clients/:id');
        const { user } = renderDetail();

        await startEditing(user);
        await user.clear(screen.getByLabelText(/^Jméno/));
        await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

        expect(screen.getByText('Prosím zadejte jméno')).toBeInTheDocument();
        expect(updates).toHaveLength(0);
        expect(screen.getByRole('heading', { level: 1, name: 'Úprava klienta' })).toBeInTheDocument();
    });

    it('keeps the form open with the server message when saving fails', async () => {
        serveClient(MARIE);
        serveAndRecord('put', '/clients/:id', serverError('Neplatné PSČ'));
        const { user } = renderDetail();

        await startEditing(user);
        await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

        expect(await screen.findByText('Chyba při aktualizaci klienta')).toBeInTheDocument();
        expect(screen.getByText('Neplatné PSČ')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Úprava klienta' })).toBeInTheDocument();
    });

    it('asks for the contract end of a terminated client', async () => {
        serveClient(TERMINATED_MARIE);
        const updates = serveAndRecord('put', '/clients/:id', () => HttpResponse.json(TERMINATED_MARIE));
        const { user } = renderDetail();

        await startEditing(user);
        expect(screen.getByLabelText(/^Datum ukončení/)).toHaveTextContent('31. 10. 2026');
        await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

        await waitFor(() => expect(updates).toHaveLength(1));
        expect(updates[0].body).toMatchObject({ terminationDate: '2026-10-31', terminationReason: 'EXITUS' });
    });

    it('goes back to the view without saving on cancel', async () => {
        serveClient(MARIE);
        const updates = serveAndRecord('put', '/clients/:id');
        const { user } = renderDetail();

        await startEditing(user);
        await user.clear(screen.getByLabelText(/^Jméno/));
        await user.click(screen.getByRole('button', { name: 'Zrušit' }));

        expect(await screen.findByRole('heading', { level: 1, name: 'Marie Nová' })).toBeInTheDocument();
        expect(updates).toHaveLength(0);
    });
});

describe('ClientDetail – contract', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(new Date(2026, 10, 9, 12)));
    afterEach(() => vi.useRealTimers());

    it('ends the contract with a reason and a date that is not in the future', async () => {
        const { changeTo } = serveClient(MARIE);
        const terminations = serveAndRecord('put', '/clients/:id/terminate', () => {
            changeTo({ ...MARIE, active: false, terminationDate: '2026-11-05', terminationReason: 'MUTUAL_AGREEMENT' });
            return HttpResponse.json({});
        });
        const { user } = renderDetail();

        await openMoreActions(user);
        await user.click(screen.getByRole('menuitem', { name: /Ukončit smlouvu/ }));
        const dialog = screen.getByRole('dialog', { name: 'Ukončit smlouvu' });
        const date = within(dialog).getByRole('button', { name: /Datum ukončení/ });
        expect(date).toHaveTextContent('9. 11. 2026');

        await user.click(date);
        expect(screen.getByRole('button', { name: /^úterý, 10\. listopadu 2026/ })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: /^čtvrtek, 5\. listopadu 2026/ }));

        await user.click(within(dialog).getByRole('button', { name: 'Ukončit smlouvu' }));
        expect(within(dialog).getByText('Prosím vyberte důvod')).toBeInTheDocument();
        expect(terminations).toHaveLength(0);

        await user.click(within(dialog).getByRole('combobox', { name: /Důvod/ }));
        await user.click(screen.getByRole('option', { name: 'Dohoda o ukončení' }));
        await user.click(within(dialog).getByRole('button', { name: 'Ukončit smlouvu' }));

        await waitFor(() => expect(terminations).toHaveLength(1));
        expect(terminations[0].path).toMatch(/\/clients\/7\/terminate$/);
        expect(terminations[0].body).toEqual({ terminationDate: '2026-11-05', terminationReason: 'MUTUAL_AGREEMENT' });
        expect(await screen.findByText('Ukončení smlouvy')).toBeInTheDocument();
        expect(detailValue('Důvod')).toHaveTextContent('Dohoda o ukončení');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps the dialog open when the server refuses to end the contract', async () => {
        serveClient(MARIE);
        serveAndRecord('put', '/clients/:id/terminate', serverError('Klient má naplánované úkony'));
        const { user } = renderDetail();

        await openMoreActions(user);
        await user.click(screen.getByRole('menuitem', { name: /Ukončit smlouvu/ }));
        const dialog = screen.getByRole('dialog', { name: 'Ukončit smlouvu' });
        await user.click(within(dialog).getByRole('combobox', { name: /Důvod/ }));
        await user.click(screen.getByRole('option', { name: 'Exitus' }));
        await user.click(within(dialog).getByRole('button', { name: 'Ukončit smlouvu' }));

        expect(await screen.findByText('Klient má naplánované úkony')).toBeInTheDocument();
        expect(screen.getByRole('dialog', { name: 'Ukončit smlouvu' })).toBeInTheDocument();
    });

    it('reactivates a terminated client', async () => {
        const { changeTo } = serveClient(TERMINATED_MARIE);
        const activations = serveAndRecord('put', '/clients/:id/activate', () => {
            changeTo(MARIE);
            return HttpResponse.json(MARIE);
        });
        const { user } = renderDetail();

        await openMoreActions(user);
        expect(screen.queryByRole('menuitem', { name: /Ukončit smlouvu/ })).not.toBeInTheDocument();
        await user.click(screen.getByRole('menuitem', { name: /Znovu aktivovat/ }));
        await user.click(screen.getByRole('button', { name: 'Aktivovat' }));

        await waitFor(() => expect(activations).toHaveLength(1));
        expect(activations[0].path).toMatch(/\/clients\/7\/activate$/);
        await waitFor(() => expect(screen.queryByText('Ukončení smlouvy')).not.toBeInTheDocument());
        expect(screen.getByText('Klient úspěšně aktivován')).toBeInTheDocument();
    });
});
