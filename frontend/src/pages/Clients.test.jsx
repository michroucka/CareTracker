import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Clients from './Clients';
import { renderWithProviders } from '@/test/render';
import { currentSearchParams, serveAndRecord, serverError } from '@/test/hooks';
import { apiUrl, server } from '@/test/server';
import { admin, caregiver, coordinator } from '@/test/users';
import { todayIsoDate } from '@/lib/dates';

const PLZEN = { id: 2, city: 'Plzeň' };
const KLATOVY = { id: 3, city: 'Klatovy' };

const EMPLOYEES = [
    { id: 10, firstName: 'Jana', lastName: 'Testová', department: PLZEN },
    { id: 11, firstName: 'Petr', lastName: 'Svoboda', department: KLATOVY },
];

function clientRow(overrides = {}) {
    return {
        id: 7,
        firstName: 'Marie',
        lastName: 'Nová',
        street: 'Americká 12',
        city: 'Plzeň',
        active: true,
        pictureId: null,
        email: 'marie@example.cz',
        userAccountActive: null,
        userAccountActivated: null,
        department: PLZEN,
        caregiver: { id: 10, fullName: 'Jana Testová' },
        ...overrides,
    };
}

const MARIE = clientRow();
const KAREL = clientRow({ id: 8, firstName: 'Karel', lastName: 'Adam', city: 'Klatovy', department: KLATOVY, caregiver: { id: 11, fullName: 'Petr Svoboda' } });

function serveFilterOptions() {
    server.use(
        http.get(apiUrl('/departments'), () => HttpResponse.json([PLZEN, KLATOVY])),
        http.get(apiUrl('/employees'), () => HttpResponse.json(EMPLOYEES)),
    );
}

function serveClients(clients = [MARIE, KAREL]) {
    serveFilterOptions();
    return serveAndRecord('get', '/clients', () => HttpResponse.json(clients));
}

function renderClients({ authStatus = admin(), route = '/clients' } = {}) {
    return renderWithProviders(
        <Routes>
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<h1>Formulář nového klienta</h1>} />
            <Route path="/clients/:clientId" element={<h1>Detail klienta</h1>} />
            <Route path="/clients/:clientId/individual-plan" element={<h1>Individuální plán klienta</h1>} />
        </Routes>,
        { authStatus, route },
    );
}

const lastRequest = (requests) => requests.at(-1);
const rowOf = async (name) => (await screen.findByText(name)).closest('tr');

async function openActionsFor(user, fullName) {
    await user.click(await screen.findByRole('button', { name: `Akce pro ${fullName}` }));
}

describe('Clients list – filters', () => {
    it("loads the admin's own department and active clients, sorted by last name", async () => {
        const requests = serveClients();

        renderClients();

        expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
        expect(screen.getAllByText(/^(Karel Adam|Marie Nová)$/).map((name) => name.textContent)).toEqual(['Karel Adam', 'Marie Nová']);
        expect(screen.getByText('2 klienti')).toBeInTheDocument();

        const { searchParams } = lastRequest(requests);
        expect(searchParams.get('status')).toBe('true');
        expect(searchParams.getAll('departmentIds')).toEqual(['2']);
        expect(searchParams.has('caregiverIds')).toBe(false);
        expect(currentSearchParams().get('status')).toBe('true');
        expect(currentSearchParams().get('departments')).toBe('2');
        expect(currentSearchParams().get('caregivers')).toBe('all');
    });

    it('restores the filters from the URL', async () => {
        const requests = serveClients([KAREL]);

        renderClients({ route: '/clients?search=adam&status=all&departments=3&caregivers=11' });

        expect(await screen.findByText('Karel Adam')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /Hledat/ })).toHaveValue('adam');
        expect(screen.getByRole('button', { name: /Stav:/ })).toHaveTextContent('Všechny');
        expect(screen.getByRole('button', { name: /Středisko:/ })).toHaveTextContent('Klatovy');
        await waitFor(() => expect(screen.getByRole('button', { name: /Pečovatel:/ })).toHaveTextContent('Petr Svoboda'));

        await waitFor(() => expect(lastRequest(requests).searchParams.getAll('caregiverIds')).toEqual(['11']));
        const { searchParams } = lastRequest(requests);
        expect(searchParams.has('status')).toBe(false);
        expect(searchParams.getAll('departmentIds')).toEqual(['3']);
    });

    it('applies a caregiver filter from the URL already in the first request', async () => {
        const requests = serveClients([KAREL]);

        renderClients({ route: '/clients?departments=3&caregivers=11' });

        await screen.findByText('Karel Adam');
        expect(requests[0].searchParams.getAll('caregiverIds')).toEqual(['11']);
    });

    it('sends the chosen department, caregiver and status and keeps them in the URL', async () => {
        const requests = serveClients();
        const { user } = renderClients();
        await screen.findByText('Marie Nová');

        await user.click(screen.getByRole('button', { name: /Středisko:/ }));
        await user.click(screen.getByRole('option', { name: 'Klatovy' }));
        await user.keyboard('{Escape}');
        await waitFor(() => expect(lastRequest(requests).searchParams.getAll('departmentIds')).toEqual(['2', '3']));
        expect(currentSearchParams().get('departments')).toBe('2,3');

        await user.click(screen.getByRole('button', { name: /Pečovatel:/ }));
        await user.click(screen.getByRole('option', { name: 'Petr Svoboda' }));
        await user.keyboard('{Escape}');
        await waitFor(() => expect(lastRequest(requests).searchParams.getAll('caregiverIds')).toEqual(['11']));
        expect(currentSearchParams().get('caregivers')).toBe('11');

        await user.click(screen.getByRole('button', { name: /Stav:/ }));
        await user.click(screen.getByRole('menuitemcheckbox', { name: 'Neaktivní' }));
        await user.keyboard('{Escape}');
        await waitFor(() => expect(lastRequest(requests).searchParams.has('status')).toBe(false));
        expect(currentSearchParams().get('status')).toBe('all');
    });

    it('offers only caregivers of the selected departments', async () => {
        serveClients();
        const { user } = renderClients();
        await screen.findByText('Marie Nová');

        await user.click(screen.getByRole('button', { name: /Pečovatel:/ }));

        expect(screen.getByRole('option', { name: 'Jana Testová' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Petr Svoboda' })).not.toBeInTheDocument();
    });

    it('searches by name or city ignoring diacritics, in the URL too', async () => {
        const requests = serveClients();
        const { user } = renderClients();
        await screen.findByText('Marie Nová');
        const requestCount = requests.length;

        await user.type(screen.getByRole('textbox', { name: /Hledat/ }), 'nova');

        expect(screen.getByText('Marie Nová')).toBeInTheDocument();
        expect(screen.queryByText('Karel Adam')).not.toBeInTheDocument();
        expect(currentSearchParams().get('search')).toBe('nova');
        expect(requests).toHaveLength(requestCount);

        await user.clear(screen.getByRole('textbox', { name: /Hledat/ }));
        await user.type(screen.getByRole('textbox', { name: /Hledat/ }), 'klatovy');
        expect(screen.getByText('Karel Adam')).toBeInTheDocument();
        expect(screen.queryByText('Marie Nová')).not.toBeInTheDocument();
    });

    it('pages through long lists and goes back to the first page when the search changes', async () => {
        const thirtyClients = Array.from({ length: 30 }, (_, index) => clientRow({ id: 100 + index, lastName: `Příjmení${String(index).padStart(2, '0')}` }));
        serveClients(thirtyClients);
        const { user } = renderClients({ route: '/clients?page=2' });

        expect(await screen.findByText('Marie Příjmení25')).toBeInTheDocument();
        expect(screen.queryByText('Marie Příjmení00')).not.toBeInTheDocument();
        expect(currentSearchParams().get('page')).toBe('2');

        await user.click(screen.getByRole('button', { name: 'Stránka 1' }));
        expect(screen.getByText('Marie Příjmení00')).toBeInTheDocument();
        expect(currentSearchParams().has('page')).toBe(false);

        await user.click(screen.getByRole('button', { name: 'Další stránka' }));
        expect(currentSearchParams().get('page')).toBe('2');

        await user.type(screen.getByRole('textbox', { name: /Hledat/ }), 'marie');
        expect(currentSearchParams().has('page')).toBe(false);
        expect(screen.getByText('Marie Příjmení00')).toBeInTheDocument();
    });
});

describe('Clients list – empty and error states', () => {
    it('says when there are no clients', async () => {
        serveClients([]);

        renderClients();

        expect(await screen.findByText('Žádní klienti')).toBeInTheDocument();
    });

    it('offers to clear a search that matches nobody', async () => {
        serveClients();
        const { user } = renderClients({ route: '/clients?search=xyz' });

        expect(await screen.findByText('Nikdo neodpovídá hledání')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Zrušit hledání' }));

        expect(screen.getByText('Marie Nová')).toBeInTheDocument();
        expect(currentSearchParams().has('search')).toBe(false);
    });

    it('shows a toast with the server message when loading fails', async () => {
        serveFilterOptions();
        server.use(http.get(apiUrl('/clients'), serverError('Databáze neodpovídá')));

        renderClients();

        expect(await screen.findByText('Chyba při načítání klientů')).toBeInTheDocument();
        expect(screen.getByText('Databáze neodpovídá')).toBeInTheDocument();
    });
});

describe('Clients list – actions by role', () => {
    it('is read-only for a caregiver, who sees active clients of their department only', async () => {
        const requests = serveClients();

        renderClients({ authStatus: caregiver() });

        expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Nový klient/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Akce pro/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Stav:/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Středisko:/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Pečovatel:/ })).toBeInTheDocument();

        const { searchParams } = lastRequest(requests);
        expect(searchParams.get('status')).toBe('true');
        expect(searchParams.getAll('departmentIds')).toEqual(['2']);
    });

    it('lets a coordinator create and manage clients of their department', async () => {
        const requests = serveClients();
        const { user } = renderClients({ authStatus: coordinator(), route: '/clients?departments=3' });

        expect(await screen.findByRole('button', { name: /Nový klient/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Stav:/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Středisko:/ })).not.toBeInTheDocument();
        // a department in the URL does not let a coordinator look into another department
        expect(lastRequest(requests).searchParams.getAll('departmentIds')).toEqual(['2']);

        await openActionsFor(user, 'Marie Nová');
        expect(screen.getByRole('menuitem', { name: /Ukončit smlouvu/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Vytvořit účet/ })).toBeInTheDocument();
    });

    it('opens the create form from "Nový klient"', async () => {
        serveClients();
        const { user } = renderClients();

        await user.click(await screen.findByRole('button', { name: /Nový klient/ }));

        expect(screen.getByRole('heading', { name: 'Formulář nového klienta' })).toBeInTheDocument();
    });

    it('opens the client detail from the row', async () => {
        serveClients();
        const { user } = renderClients();

        await user.click(await screen.findByText('Marie Nová'));
        expect(screen.getByRole('heading', { name: 'Detail klienta' })).toBeInTheDocument();
        expect(window.location.pathname).toBe('/clients/7');
    });

    it('opens the individual plan from the row menu', async () => {
        serveClients();
        const { user } = renderClients();

        await openActionsFor(user, 'Marie Nová');
        await user.click(screen.getByRole('menuitem', { name: /Individuální plán/ }));

        expect(window.location.pathname).toBe('/clients/7/individual-plan');
    });
});

describe('Clients list – contract and account actions', () => {
    it("ends a client's contract with a reason and today's date", async () => {
        serveClients();
        const terminations = serveAndRecord('put', '/clients/:id/terminate', () => HttpResponse.json({ ...MARIE, active: false }));
        const { user } = renderClients();

        await openActionsFor(user, 'Marie Nová');
        await user.click(screen.getByRole('menuitem', { name: /Ukončit smlouvu/ }));
        const dialog = screen.getByRole('dialog', { name: 'Ukončit smlouvu' });
        await user.click(within(dialog).getByRole('button', { name: 'Ukončit smlouvu' }));
        expect(within(dialog).getByText('Prosím vyberte důvod')).toBeInTheDocument();
        expect(terminations).toHaveLength(0);

        await user.click(within(dialog).getByRole('combobox', { name: /Důvod/ }));
        await user.click(screen.getByRole('option', { name: 'Pobytová služba' }));
        await user.click(within(dialog).getByRole('button', { name: 'Ukončit smlouvu' }));

        await waitFor(() => expect(terminations).toHaveLength(1));
        expect(terminations[0].path).toMatch(/\/clients\/7\/terminate$/);
        expect(terminations[0].body).toEqual({ terminationDate: todayIsoDate(), terminationReason: 'RESIDENTIAL_SERVICE' });
        expect(await screen.findByText('Klient úspěšně deaktivován')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('reactivates a terminated client after confirmation', async () => {
        serveClients([clientRow({ active: false })]);
        const activations = serveAndRecord('put', '/clients/:id/activate', () => HttpResponse.json(MARIE));
        const { user } = renderClients({ route: '/clients?status=false' });

        await openActionsFor(user, 'Marie Nová');
        await user.click(screen.getByRole('menuitem', { name: /Znovu aktivovat/ }));
        await user.click(screen.getByRole('button', { name: 'Aktivovat' }));

        await waitFor(() => expect(activations).toHaveLength(1));
        expect(activations[0].path).toMatch(/\/clients\/7\/activate$/);
        expect(await screen.findByText('Klient úspěšně aktivován')).toBeInTheDocument();
    });

    it('creates a client account for the e-mail in the dialog', async () => {
        serveClients();
        const accounts = serveAndRecord('post', '/clients/:id/account/create', () => HttpResponse.json({ success: true, message: 'Aktivační e-mail odeslán' }));
        const { user } = renderClients();

        await openActionsFor(user, 'Marie Nová');
        await user.click(screen.getByRole('menuitem', { name: /Vytvořit účet/ }));
        const dialog = screen.getByRole('dialog', { name: 'Účet pro klienta' });
        const email = within(dialog).getByRole('textbox', { name: /E-mail/ });
        expect(email).toHaveValue('marie@example.cz');

        await user.clear(email);
        await user.type(email, 'nova@example.cz');
        await user.click(within(dialog).getByRole('button', { name: 'Vytvořit účet' }));

        await waitFor(() => expect(accounts).toHaveLength(1));
        expect(accounts[0].path).toMatch(/\/clients\/7\/account\/create$/);
        expect(accounts[0].searchParams.get('email')).toBe('nova@example.cz');
        expect(await screen.findByText('Aktivační e-mail odeslán')).toBeInTheDocument();
    });

    it('blocks an active account after confirmation', async () => {
        serveClients([clientRow({ userAccountActive: true, userAccountActivated: true })]);
        const blocks = serveAndRecord('put', '/clients/:id/account/deactivate');
        const { user } = renderClients();

        expect(within(await rowOf('Marie Nová')).getByText('Aktivní účet')).toBeInTheDocument();
        await openActionsFor(user, 'Marie Nová');
        expect(screen.queryByRole('menuitem', { name: /Vytvořit účet/ })).not.toBeInTheDocument();
        await user.click(screen.getByRole('menuitem', { name: /Zablokovat účet/ }));
        await user.click(screen.getByRole('button', { name: 'Zablokovat' }));

        await waitFor(() => expect(blocks).toHaveLength(1));
        expect(blocks[0].path).toMatch(/\/clients\/7\/account\/deactivate$/);
        expect(await screen.findByText('Účet klienta byl deaktivován')).toBeInTheDocument();
    });

    it('unblocks a blocked account right away', async () => {
        serveClients([clientRow({ userAccountActive: false, userAccountActivated: true })]);
        const unblocks = serveAndRecord('put', '/clients/:id/account/activate');
        const { user } = renderClients();

        await openActionsFor(user, 'Marie Nová');
        await user.click(screen.getByRole('menuitem', { name: /Odblokovat účet/ }));

        await waitFor(() => expect(unblocks).toHaveLength(1));
        expect(unblocks[0].path).toMatch(/\/clients\/7\/account\/activate$/);
        expect(await screen.findByText('Účet klienta byl aktivován')).toBeInTheDocument();
    });

    it('resends the activation e-mail of an account waiting for activation', async () => {
        serveClients([clientRow({ userAccountActive: true, userAccountActivated: false })]);
        const resends = serveAndRecord('post', '/clients/:id/account/resend', () => HttpResponse.json({ success: true, message: 'E-mail znovu odeslán' }));
        const { user } = renderClients();

        expect(within(await rowOf('Marie Nová')).getByText('Čeká na aktivaci')).toBeInTheDocument();
        await openActionsFor(user, 'Marie Nová');
        await user.click(screen.getByRole('menuitem', { name: /Znovu poslat aktivační e-mail/ }));

        await waitFor(() => expect(resends).toHaveLength(1));
        expect(resends[0].path).toMatch(/\/clients\/7\/account\/resend$/);
        expect(await screen.findByText('E-mail znovu odeslán')).toBeInTheDocument();
    });
});
