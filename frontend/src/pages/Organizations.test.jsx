import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import Organizations from './Organizations';
import { serveAndRecord, serverError } from '@/test/hooks';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { superadmin } from '@/test/users';

function organization(overrides = {}) {
    return {
        id: 5,
        name: 'Charita Plzeň',
        manager: { id: 51, fullName: 'Hana Vedoucí' },
        accountPrefix: '19',
        accountNumber: '2000145399',
        bankCode: '0800',
        active: true,
        ...overrides,
    };
}

const CHARITA = organization();
const DIAKONIE = organization({ id: 6, name: 'Diakonie Klatovy', manager: null, accountPrefix: null, accountNumber: null, bankCode: null });

const HANA = { id: 51, firstName: 'Hana', lastName: 'Vedoucí', department: { id: 2, city: 'Plzeň' } };
const MARIE = { id: 52, firstName: 'Marie', lastName: 'Nová', department: { id: 3, city: 'Klatovy' } };

function serveOrganizations(organizations = [CHARITA, DIAKONIE]) {
    const organizationRequests = serveAndRecord('get', '/organizations', () => HttpResponse.json(organizations));
    const employeeRequests = serveAndRecord('get', '/employees', () => HttpResponse.json([HANA, MARIE]));
    server.use(http.get(apiUrl('/organizations/:id'), ({ params }) => HttpResponse.json(organizations.find((item) => item.id === Number(params.id)))));
    return { organizationRequests, employeeRequests };
}

const renderOrganizations = (route = '/organizations') => renderWithProviders(<Organizations />, { authStatus: superadmin(), route });

const currentParams = () => new URLSearchParams(window.location.search);

async function openCreateDialog(user) {
    await user.click(await screen.findByRole('button', { name: /Nová organizace/ }));
    return screen.findByRole('dialog', { name: 'Nová organizace' });
}

async function confirmFromRowMenu(user, name, action, dialogTitle) {
    await user.click(await screen.findByRole('button', { name: `Akce pro ${name}` }));
    await user.click(await screen.findByRole('menuitem', { name: action }));
    const confirm = await screen.findByRole('alertdialog', { name: dialogTitle });
    await user.click(within(confirm).getByRole('button', { name: action }));
}

describe('Organizations', () => {
    describe('filters', () => {
        it('loads active organizations by default and keeps the status in the URL', async () => {
            const { organizationRequests } = serveOrganizations();

            renderOrganizations();

            expect(await screen.findByText('Charita Plzeň')).toBeInTheDocument();
            expect(organizationRequests.at(-1).searchParams.get('status')).toBe('true');
            expect(currentParams().get('status')).toBe('true');
            expect(screen.getByText('2 organizace')).toBeInTheDocument();
        });

        it('restores the status filter and search from the URL', async () => {
            const { organizationRequests } = serveOrganizations();

            renderOrganizations('/organizations?status=false&search=diakonie');

            expect(await screen.findByText('Diakonie Klatovy')).toBeInTheDocument();
            expect(organizationRequests.at(-1).searchParams.get('status')).toBe('false');
            expect(screen.getByRole('button', { name: /Stav:/ })).toHaveTextContent('Neaktivní');
            expect(screen.queryByText('Charita Plzeň')).not.toBeInTheDocument();
        });

        it('asks for all organizations when both statuses are selected', async () => {
            const { organizationRequests } = serveOrganizations();
            const { user } = renderOrganizations();
            await screen.findByText('Charita Plzeň');

            await user.click(screen.getByRole('button', { name: /Stav:/ }));
            await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Neaktivní' }));

            await waitFor(() => expect(organizationRequests.at(-1).searchParams.has('status')).toBe(false));
            expect(currentParams().get('status')).toBe('all');
        });

        it('shows the manager and bank account of each organization', async () => {
            serveOrganizations();

            renderOrganizations();

            const charita = (await screen.findByText('Charita Plzeň')).closest('tr');
            expect(within(charita).getByText('Hana Vedoucí')).toBeInTheDocument();
            expect(within(charita).getByText('19-2000145399/0800')).toBeInTheDocument();
        });
    });

    it('shows the empty state with a create button', async () => {
        serveOrganizations([]);

        renderOrganizations();

        expect(await screen.findByText('Zatím tu není žádná organizace')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Nová organizace/ })).toHaveLength(2);
    });

    it('shows a no-match state for a search', async () => {
        serveOrganizations();

        renderOrganizations('/organizations?search=xyz');

        expect(await screen.findByText('Žádná organizace neodpovídá hledání')).toBeInTheDocument();
    });

    it('shows the server message in a toast when the list fails to load', async () => {
        server.use(http.get(apiUrl('/organizations'), serverError('Databáze je nedostupná')));

        renderOrganizations();

        expect(await screen.findByText('Chyba při načítání organizací')).toBeInTheDocument();
        expect(screen.getByText('Databáze je nedostupná')).toBeInTheDocument();
    });

    describe('detail', () => {
        it("opens the organization from ?detail= and loads its employees", async () => {
            const { employeeRequests } = serveOrganizations();

            renderOrganizations('/organizations?detail=5');

            const sheet = await screen.findByRole('dialog', { name: 'Charita Plzeň' });
            expect(within(sheet).getByText('Hana Vedoucí')).toBeInTheDocument();
            expect(within(sheet).getByText('19-2000145399/0800')).toBeInTheDocument();
            const { searchParams } = employeeRequests.at(-1);
            expect(searchParams.get('organizationId')).toBe('5');
            expect(searchParams.get('status')).toBe('true');
        });

        it('puts the opened organization into the URL', async () => {
            serveOrganizations();
            const { user } = renderOrganizations();

            await user.click(await screen.findByText('Diakonie Klatovy'));

            const sheet = await screen.findByRole('dialog', { name: 'Diakonie Klatovy' });
            expect(within(sheet).getByText('Organizace zatím nemá vedoucího.')).toBeInTheDocument();
            expect(currentParams().get('detail')).toBe('6');
        });

        it('validates the bank account and saves the manager', async () => {
            serveOrganizations();
            const updates = serveAndRecord('put', '/organizations/:id', ({ request }) => request.json().then((body) => HttpResponse.json({
                ...DIAKONIE, ...body, manager: { id: MARIE.id, fullName: 'Marie Nová' },
            })));
            const { user } = renderOrganizations('/organizations?detail=6');

            const sheet = await screen.findByRole('dialog', { name: 'Diakonie Klatovy' });
            await user.click(within(sheet).getByRole('button', { name: /Upravit/ }));
            await user.type(await screen.findByRole('textbox', { name: 'Číslo účtu' }), '1');
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Číslo účtu má 2 až 10 číslic')).toBeInTheDocument();
            expect(screen.getByText('Kód banky má 4 číslice')).toBeInTheDocument();
            expect(updates).toHaveLength(0);

            await user.type(screen.getByRole('textbox', { name: 'Číslo účtu' }), '23456');
            await user.type(screen.getByRole('textbox', { name: 'Kód banky' }), '0100');
            await user.click(screen.getByRole('combobox', { name: 'Vedoucí' }));
            await user.click(await screen.findByRole('option', { name: /Marie Nová/ }));
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Organizace úspěšně aktualizována')).toBeInTheDocument();
            expect(updates[0].path).toBe('/api/organizations/6');
            expect(updates[0].body).toEqual({
                name: 'Diakonie Klatovy',
                managerId: 52,
                accountPrefix: null,
                accountNumber: '123456',
                bankCode: '0100',
            });
            expect(await within(sheet).findByText('123456/0100')).toBeInTheDocument();
            expect(within(sheet).getByText('Marie Nová')).toBeInTheDocument();
        });

        it('keeps the form open with the server message when saving fails', async () => {
            serveOrganizations();
            serveAndRecord('put', '/organizations/:id', serverError('Vedoucí musí mít uživatelský účet', 400));
            const { user } = renderOrganizations('/organizations?detail=5');

            const sheet = await screen.findByRole('dialog', { name: 'Charita Plzeň' });
            await user.click(within(sheet).getByRole('button', { name: /Upravit/ }));
            await screen.findByRole('textbox', { name: 'Název' });
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Chyba při aktualizaci organizace')).toBeInTheDocument();
            expect(screen.getByText('Vedoucí musí mít uživatelský účet')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeInTheDocument();
        });
    });

    describe('create', () => {
        it('validates the form and sends the new organization without a manager field', async () => {
            serveOrganizations();
            const creates = serveAndRecord('post', '/organizations', () => HttpResponse.json(organization({ id: 7, name: 'Domov Rokycany', manager: null })));
            const { user } = renderOrganizations();

            const dialog = await openCreateDialog(user);
            expect(within(dialog).queryByRole('combobox', { name: 'Vedoucí' })).not.toBeInTheDocument();
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit organizaci' }));
            expect(within(dialog).getByText('Prosím zadejte název')).toBeInTheDocument();
            expect(creates).toHaveLength(0);

            await user.type(within(dialog).getByRole('textbox', { name: 'Název' }), ' Domov Rokycany ');
            await user.type(within(dialog).getByRole('textbox', { name: 'Předčíslí' }), '19');
            await user.type(within(dialog).getByRole('textbox', { name: 'Číslo účtu' }), '2000145399');
            await user.type(within(dialog).getByRole('textbox', { name: 'Kód banky' }), '0800');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit organizaci' }));

            expect(await screen.findByText('Organizace úspěšně vytvořena')).toBeInTheDocument();
            expect(creates[0].body).toEqual({
                name: 'Domov Rokycany',
                managerId: null,
                accountPrefix: '19',
                accountNumber: '2000145399',
                bankCode: '0800',
            });
            expect(await screen.findByText('Domov Rokycany')).toBeInTheDocument();
            await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nová organizace' })).not.toBeInTheDocument());
        });

        it('keeps the dialog open with the server message when creating fails', async () => {
            serveOrganizations();
            serveAndRecord('post', '/organizations', serverError('Organizace s tímto názvem už existuje', 409));
            const { user } = renderOrganizations();

            const dialog = await openCreateDialog(user);
            await user.type(within(dialog).getByRole('textbox', { name: 'Název' }), 'Charita Plzeň');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit organizaci' }));

            expect(await screen.findByText('Chyba při vytváření organizace')).toBeInTheDocument();
            expect(screen.getByText('Organizace s tímto názvem už existuje')).toBeInTheDocument();
            expect(screen.getByRole('dialog', { name: 'Nová organizace' })).toBeInTheDocument();
        });
    });

    describe('deactivate and activate', () => {
        it('warns that accounts get blocked and deactivates the organization', async () => {
            serveOrganizations();
            const terminations = serveAndRecord('put', '/organizations/:id/terminate', () => HttpResponse.json(organization({ active: false })));
            const { user } = renderOrganizations();

            await user.click(await screen.findByRole('button', { name: 'Akce pro Charita Plzeň' }));
            await user.click(await screen.findByRole('menuitem', { name: 'Deaktivovat' }));
            const confirm = await screen.findByRole('alertdialog', { name: 'Deaktivovat organizaci?' });
            expect(confirm).toHaveTextContent('uživatelské účty jejích zaměstnanců i klientů se zablokují');
            await user.click(within(confirm).getByRole('button', { name: 'Deaktivovat' }));

            expect(await screen.findByText('Organizace úspěšně deaktivována')).toBeInTheDocument();
            expect(terminations[0].path).toBe('/api/organizations/5/terminate');
        });

        it('keeps the confirmation open and shows the server message when deactivation fails', async () => {
            serveOrganizations();
            serveAndRecord('put', '/organizations/:id/terminate', serverError('Organizace má aktivní střediska', 409));
            const { user } = renderOrganizations();

            await confirmFromRowMenu(user, 'Charita Plzeň', 'Deaktivovat', 'Deaktivovat organizaci?');

            expect(await screen.findByText('Chyba při deaktivaci organizace')).toBeInTheDocument();
            expect(screen.getByText('Organizace má aktivní střediska')).toBeInTheDocument();
            expect(screen.getByRole('alertdialog', { name: 'Deaktivovat organizaci?' })).toBeInTheDocument();
        });

        it('activates an inactive organization', async () => {
            serveOrganizations([organization({ active: false })]);
            const activations = serveAndRecord('put', '/organizations/:id/activate', () => HttpResponse.json(CHARITA));
            const { user } = renderOrganizations('/organizations?status=false');

            await confirmFromRowMenu(user, 'Charita Plzeň', 'Aktivovat', 'Aktivovat organizaci?');

            expect(await screen.findByText('Organizace úspěšně aktivována')).toBeInTheDocument();
            expect(activations[0].path).toBe('/api/organizations/5/activate');
        });

        it('shows the server message when activation fails', async () => {
            serveOrganizations([organization({ active: false })]);
            serveAndRecord('put', '/organizations/:id/activate', serverError('Aktivaci se nepodařilo uložit'));
            const { user } = renderOrganizations('/organizations?status=false');

            await confirmFromRowMenu(user, 'Charita Plzeň', 'Aktivovat', 'Aktivovat organizaci?');

            expect(await screen.findByText('Chyba při aktivaci organizace')).toBeInTheDocument();
            expect(screen.getByText('Aktivaci se nepodařilo uložit')).toBeInTheDocument();
        });
    });
});
