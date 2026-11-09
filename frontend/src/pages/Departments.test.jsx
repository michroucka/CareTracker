import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import Departments from './Departments';
import { serveAndRecord, serverError } from '@/test/hooks';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { admin, superadmin } from '@/test/users';

function department(overrides = {}) {
    return {
        id: 2,
        city: 'Plzeň',
        street: 'Americká 12',
        postalCode: '301 00',
        departmentNumber: 7,
        coordinator: { id: 41, fullName: 'Petr Svoboda' },
        active: true,
        ...overrides,
    };
}

const PLZEN = department();
const KLATOVY = department({ id: 3, city: 'Klatovy', street: 'Domažlická 5', postalCode: null, departmentNumber: null, coordinator: null });

const COORDINATOR_PETR = { id: 41, firstName: 'Petr', lastName: 'Svoboda', role: 'COORDINATOR', department: { id: 2, city: 'Plzeň' } };
const CAREGIVER_MARIE = { id: 42, firstName: 'Marie', lastName: 'Nová', role: 'CAREGIVER', department: { id: 2, city: 'Plzeň' } };

function serveDepartments(departments = [PLZEN, KLATOVY]) {
    const departmentRequests = serveAndRecord('get', '/departments', () => HttpResponse.json(departments));
    const employeeRequests = serveAndRecord('get', '/employees', () => HttpResponse.json([COORDINATOR_PETR, CAREGIVER_MARIE]));
    server.use(http.get(apiUrl('/departments/:id'), ({ params }) => HttpResponse.json(departments.find((item) => item.id === Number(params.id)))));
    return { departmentRequests, employeeRequests };
}

const renderDepartments = (authStatus = admin(), route = '/departments') => renderWithProviders(<Departments />, { authStatus, route });

const currentParams = () => new URLSearchParams(window.location.search);

async function openCreateDialog(user) {
    await user.click(await screen.findByRole('button', { name: /Nové středisko/ }));
    return screen.findByRole('dialog', { name: 'Nové středisko' });
}

async function confirmTermination(user, city) {
    await user.click(await screen.findByRole('button', { name: `Akce pro středisko ${city}` }));
    await user.click(await screen.findByRole('menuitem', { name: /Deaktivovat/ }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Deaktivovat středisko?' });
    await user.click(within(confirm).getByRole('button', { name: 'Deaktivovat' }));
}

describe('Departments', () => {
    describe('filters', () => {
        it('loads active departments and active employees for the coordinator field', async () => {
            const { departmentRequests, employeeRequests } = serveDepartments();

            renderDepartments();

            expect(await screen.findByText('Plzeň')).toBeInTheDocument();
            expect(departmentRequests.at(-1).searchParams.get('status')).toBe('true');
            expect(employeeRequests.at(-1).searchParams.get('status')).toBe('true');
            expect(currentParams().get('status')).toBe('true');
            expect(screen.getByText('2 střediska')).toBeInTheDocument();
        });

        it('restores the status filter and search from the URL', async () => {
            const { departmentRequests } = serveDepartments();

            renderDepartments(admin(), '/departments?status=false&search=domaz');

            expect(await screen.findByText('Klatovy')).toBeInTheDocument();
            expect(departmentRequests.at(-1).searchParams.get('status')).toBe('false');
            expect(screen.getByRole('button', { name: /Stav:/ })).toHaveTextContent('Neaktivní');
            expect(screen.queryByText('Plzeň')).not.toBeInTheDocument();
        });

        it('asks for all departments when both statuses are selected', async () => {
            const { departmentRequests } = serveDepartments();
            const { user } = renderDepartments();
            await screen.findByText('Plzeň');

            await user.click(screen.getByRole('button', { name: /Stav:/ }));
            await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Neaktivní' }));

            await waitFor(() => expect(departmentRequests.at(-1).searchParams.has('status')).toBe(false));
            expect(currentParams().get('status')).toBe('all');
        });

        it('shows address, number and coordinator of each department', async () => {
            serveDepartments();

            renderDepartments();

            const plzen = (await screen.findByText('Plzeň')).closest('tr');
            expect(plzen).toHaveTextContent('Americká 12, 301 00');
            expect(within(plzen).getByText('7')).toBeInTheDocument();
            expect(within(plzen).getByText('Petr Svoboda')).toBeInTheDocument();
        });
    });

    it('shows the empty state with a create button', async () => {
        serveDepartments([]);

        renderDepartments();

        expect(await screen.findByText('Zatím tu není žádné středisko')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Nové středisko/ })).toHaveLength(2);
    });

    it('shows the server message in a toast when the list fails to load', async () => {
        serveDepartments();
        server.use(http.get(apiUrl('/departments'), serverError('Databáze je nedostupná')));

        renderDepartments();

        expect(await screen.findByText('Chyba při načítání střediska')).toBeInTheDocument();
        expect(screen.getByText('Databáze je nedostupná')).toBeInTheDocument();
    });

    describe('superadmin', () => {
        it('asks to pick an organization first', async () => {
            const { departmentRequests } = serveDepartments();

            renderDepartments(superadmin());

            expect(await screen.findByText('Vyberte organizaci')).toBeInTheDocument();
            expect(departmentRequests).toHaveLength(0);
            expect(screen.queryByRole('button', { name: /Nové středisko/ })).not.toBeInTheDocument();
        });

        it('works in the selected organization', async () => {
            localStorage.setItem('superadmin_org', JSON.stringify({ id: 5, name: 'Charita Plzeň' }));
            const { departmentRequests, employeeRequests } = serveDepartments();
            const creates = serveAndRecord('post', '/departments', () => HttpResponse.json(department({ id: 9, city: 'Rokycany', coordinator: null })));
            const { user } = renderDepartments(superadmin());

            expect(await screen.findByText('Regionální pobočky organizace Charita Plzeň.')).toBeInTheDocument();
            expect(departmentRequests.at(-1).searchParams.get('organizationId')).toBe('5');
            expect(employeeRequests.at(-1).searchParams.get('organizationId')).toBe('5');

            const dialog = await openCreateDialog(user);
            await user.type(within(dialog).getByRole('textbox', { name: 'Ulice a číslo popisné' }), 'Masarykova 1');
            await user.type(within(dialog).getByRole('textbox', { name: 'Město' }), 'Rokycany');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit středisko' }));

            await waitFor(() => expect(creates).toHaveLength(1));
            expect(creates[0].body.organizationId).toBe(5);
        });
    });

    describe('detail', () => {
        it('opens the department from ?detail= in the URL', async () => {
            serveDepartments();

            renderDepartments(admin(), '/departments?detail=2');

            const sheet = await screen.findByRole('dialog', { name: 'Plzeň' });
            expect(within(sheet).getByText('Americká 12, 301 00 Plzeň')).toBeInTheDocument();
            expect(within(sheet).getByText('Petr Svoboda')).toBeInTheDocument();
            expect(within(sheet).getByText('č. 7')).toBeInTheDocument();
        });

        it('puts the opened department into the URL', async () => {
            serveDepartments();
            const { user } = renderDepartments();

            await user.click(await screen.findByText('Klatovy'));

            const sheet = await screen.findByRole('dialog', { name: 'Klatovy' });
            expect(within(sheet).getByText('Středisko zatím nemá koordinátora.')).toBeInTheDocument();
            expect(currentParams().get('detail')).toBe('3');
        });

        it('validates and saves edits including the coordinator', async () => {
            serveDepartments();
            const updates = serveAndRecord('put', '/departments/:id', ({ request }) => request.json().then((body) => HttpResponse.json({ ...KLATOVY, ...body })));
            const { user } = renderDepartments(admin(), '/departments?detail=3');

            const sheet = await screen.findByRole('dialog', { name: 'Klatovy' });
            await user.click(within(sheet).getByRole('button', { name: /Upravit/ }));
            const postalCode = await screen.findByRole('textbox', { name: 'PSČ' });
            await user.type(postalCode, '339');
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));
            expect(await screen.findByText('PSČ má 5 číslic')).toBeInTheDocument();
            expect(updates).toHaveLength(0);

            await user.type(postalCode, '01');
            await user.type(screen.getByRole('textbox', { name: 'Číslo střediska' }), '12');
            await user.click(screen.getByRole('combobox', { name: 'Koordinátor' }));
            const options = (await screen.findAllByRole('option')).map((option) => option.textContent);
            expect(options.some((option) => option.includes('Petr Svoboda'))).toBe(false);
            await user.click(screen.getByRole('option', { name: /Marie Nová/ }));
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Středisko úspěšně aktualizováno')).toBeInTheDocument();
            expect(updates[0].path).toBe('/api/departments/3');
            expect(updates[0].body).toEqual({
                street: 'Domažlická 5',
                city: 'Klatovy',
                postalCode: '339 01',
                departmentNumber: 12,
                coordinatorId: 42,
                organizationId: null,
            });
        });

        it('keeps the form open with the server message when saving fails', async () => {
            serveDepartments();
            serveAndRecord('put', '/departments/:id', serverError('Koordinátor už vede jiné středisko', 409));
            const { user } = renderDepartments(admin(), '/departments?detail=2');

            const sheet = await screen.findByRole('dialog', { name: 'Plzeň' });
            await user.click(within(sheet).getByRole('button', { name: /Upravit/ }));
            await screen.findByRole('textbox', { name: 'Město' });
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Chyba při aktualizaci střediska')).toBeInTheDocument();
            expect(screen.getByText('Koordinátor už vede jiné středisko')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeInTheDocument();
        });
    });

    describe('create', () => {
        it('validates the form and sends the new department', async () => {
            const { employeeRequests } = serveDepartments();
            const creates = serveAndRecord('post', '/departments', () => HttpResponse.json(department({ id: 9, city: 'Rokycany', coordinator: null })));
            const { user } = renderDepartments();

            const dialog = await openCreateDialog(user);
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit středisko' }));
            expect(within(dialog).getByText('Prosím zadejte ulici')).toBeInTheDocument();
            expect(within(dialog).getByText('Prosím zadejte město')).toBeInTheDocument();
            expect(creates).toHaveLength(0);

            await user.type(within(dialog).getByRole('textbox', { name: 'Ulice a číslo popisné' }), ' Masarykova 1 ');
            await user.type(within(dialog).getByRole('textbox', { name: 'Město' }), 'Rokycany');
            await user.type(within(dialog).getByRole('textbox', { name: 'PSČ' }), '33701');
            const employeeRequestsBefore = employeeRequests.length;
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit středisko' }));

            expect(await screen.findByText('Středisko úspěšně vytvořeno')).toBeInTheDocument();
            expect(creates[0].body).toEqual({
                street: 'Masarykova 1',
                city: 'Rokycany',
                postalCode: '337 01',
                departmentNumber: null,
                coordinatorId: null,
                organizationId: null,
            });
            expect(await screen.findByText('Rokycany')).toBeInTheDocument();
            // the coordinator options are reloaded, a new coordinator is no longer free
            await waitFor(() => expect(employeeRequests.length).toBe(employeeRequestsBefore + 1));
        });

        it('keeps the dialog open with the server message when creating fails', async () => {
            serveDepartments();
            serveAndRecord('post', '/departments', serverError('Středisko s tímto číslem už existuje', 409));
            const { user } = renderDepartments();

            const dialog = await openCreateDialog(user);
            await user.type(within(dialog).getByRole('textbox', { name: 'Ulice a číslo popisné' }), 'Masarykova 1');
            await user.type(within(dialog).getByRole('textbox', { name: 'Město' }), 'Rokycany');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit středisko' }));

            expect(await screen.findByText('Chyba při vytváření střediska')).toBeInTheDocument();
            expect(screen.getByText('Středisko s tímto číslem už existuje')).toBeInTheDocument();
            expect(screen.getByRole('dialog', { name: 'Nové středisko' })).toBeInTheDocument();
        });
    });

    describe('deactivate and activate', () => {
        it('deactivates a department after confirmation', async () => {
            serveDepartments();
            const terminations = serveAndRecord('put', '/departments/:id/terminate', () => HttpResponse.json(department({ active: false })));
            const { user } = renderDepartments();

            await confirmTermination(user, 'Plzeň');

            expect(await screen.findByText('Středisko úspěšně deaktivováno')).toBeInTheDocument();
            expect(terminations[0].path).toBe('/api/departments/2/terminate');
            await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        });

        it('keeps the confirmation open and shows why a department with active clients cannot be deactivated', async () => {
            serveDepartments();
            const message = 'Středisko má 4 aktivní klienty. Nejdřív je ukončete nebo přesuňte.';
            serveAndRecord('put', '/departments/:id/terminate', serverError(message, 409));
            const { user } = renderDepartments();

            await confirmTermination(user, 'Plzeň');

            expect(await screen.findByText('Chyba při deaktivaci střediska')).toBeInTheDocument();
            expect(screen.getByText(message)).toBeInTheDocument();
            expect(screen.getByRole('alertdialog', { name: 'Deaktivovat středisko?' })).toBeInTheDocument();
        });

        it('activates an inactive department from the detail', async () => {
            serveDepartments([department({ active: false })]);
            const activations = serveAndRecord('put', '/departments/:id/activate', () => HttpResponse.json(PLZEN));
            const { user } = renderDepartments(admin(), '/departments?status=false&detail=2');

            const sheet = await screen.findByRole('dialog', { name: 'Plzeň' });
            await user.click(within(sheet).getByRole('button', { name: 'Další akce' }));
            await user.click(await screen.findByRole('menuitem', { name: /Aktivovat středisko/ }));
            await user.click(within(await screen.findByRole('alertdialog', { name: 'Aktivovat středisko?' })).getByRole('button', { name: 'Aktivovat' }));

            expect(await screen.findByText('Středisko úspěšně aktivováno')).toBeInTheDocument();
            expect(activations[0].path).toBe('/api/departments/2/activate');
        });

        it('shows the server message when activation fails', async () => {
            serveDepartments([department({ active: false })]);
            serveAndRecord('put', '/departments/:id/activate', serverError('Organizace střediska je neaktivní', 409));
            const { user } = renderDepartments(admin(), '/departments?status=false');

            await user.click(await screen.findByRole('button', { name: 'Akce pro středisko Plzeň' }));
            await user.click(await screen.findByRole('menuitem', { name: /Aktivovat/ }));
            await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Aktivovat' }));

            expect(await screen.findByText('Chyba při aktivaci střediska')).toBeInTheDocument();
            expect(screen.getByText('Organizace střediska je neaktivní')).toBeInTheDocument();
        });
    });
});
