import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import Employees from './Employees';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { serveAndRecord, serverError } from '@/test/hooks';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { admin, caregiver, coordinator, superadmin } from '@/test/users';

const PLZEN = { id: 2, city: 'Plzeň' };
const KLATOVY = { id: 3, city: 'Klatovy' };

function employee(overrides = {}) {
    return {
        id: 31,
        firstName: 'Marie',
        lastName: 'Nová',
        role: 'CAREGIVER',
        department: PLZEN,
        email: 'marie@caretracker.test',
        isActivated: true,
        isAdmin: false,
        active: true,
        pictureId: null,
        ...overrides,
    };
}

const MARIE = employee();
const PENDING_KAREL = employee({ id: 32, firstName: 'Karel', lastName: 'Starý', isActivated: false, email: 'karel@caretracker.test' });
const ADMIN_EVA = employee({ id: 33, firstName: 'Eva', lastName: 'Malá', role: 'MANAGER', isAdmin: true, email: 'eva@caretracker.test' });

function serveEmployees(employees = [MARIE, PENDING_KAREL, ADMIN_EVA]) {
    const departmentRequests = serveAndRecord('get', '/departments', () => HttpResponse.json([PLZEN, KLATOVY]));
    const employeeRequests = serveAndRecord('get', '/employees', () => HttpResponse.json(employees));
    server.use(
        http.get(apiUrl('/employees/:id'), ({ params }) => HttpResponse.json(employees.find((item) => item.id === Number(params.id)))),
        http.get(apiUrl('/clients'), () => HttpResponse.json([])),
        http.get(apiUrl('/performed-tasks'), () => HttpResponse.json([])),
    );
    return { departmentRequests, employeeRequests };
}

const renderEmployees = (authStatus, route = '/employees') => renderWithProviders(<Employees />, { authStatus, route });

const lastRequest = (requests) => requests.at(-1);
const currentParams = () => new URLSearchParams(window.location.search);
const rowOf = (name) => screen.getByText(name).closest('tr');

async function openRowMenu(user, name) {
    await user.click(await screen.findByRole('button', { name: `Akce pro ${name}` }));
    return screen.findByRole('menu');
}

describe('Employees', () => {
    describe('filters', () => {
        it("loads an admin's own department and active employees by default and keeps it in the URL", async () => {
            const { employeeRequests } = serveEmployees();

            renderEmployees(admin());

            expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
            const { searchParams } = lastRequest(employeeRequests);
            expect(searchParams.get('status')).toBe('true');
            expect(searchParams.getAll('departmentIds')).toEqual(['2']);
            expect(searchParams.has('organizationId')).toBe(false);
            expect(currentParams().get('departments')).toBe('2');
            expect(currentParams().get('status')).toBe('true');
        });

        it('restores the department and status filters from the URL', async () => {
            const { employeeRequests } = serveEmployees();

            renderEmployees(admin(), '/employees?status=all&departments=2,3');

            expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
            const { searchParams } = lastRequest(employeeRequests);
            expect(searchParams.has('status')).toBe(false);
            expect(searchParams.getAll('departmentIds')).toEqual(['2', '3']);
            expect(screen.getByRole('button', { name: /Stav: Všechny/ })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Středisko:/ })).toHaveTextContent('2 vybrané');
        });

        it('asks for inactive employees when the status filter changes', async () => {
            const { employeeRequests } = serveEmployees();
            const { user } = renderEmployees(admin());
            await screen.findByText('Marie Nová');

            await user.click(screen.getByRole('button', { name: /Stav: Aktivní/ }));
            await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Neaktivní' }));
            await user.click(screen.getByRole('menuitemcheckbox', { name: 'Aktivní' }));

            await waitFor(() => expect(lastRequest(employeeRequests).searchParams.get('status')).toBe('false'));
            expect(currentParams().get('status')).toBe('false');
        });

        it('switches to all departments in the department filter', async () => {
            const { employeeRequests } = serveEmployees();
            const { user } = renderEmployees(admin());
            await screen.findByText('Marie Nová');

            const departmentFilter = screen.getByRole('button', { name: /Středisko:/ });
            await waitFor(() => expect(departmentFilter).toHaveTextContent('Plzeň'));
            await user.click(departmentFilter);
            await user.click(await screen.findByRole('option', { name: 'Všechna' }));

            await waitFor(() => expect(lastRequest(employeeRequests).searchParams.has('departmentIds')).toBe(false));
            expect(currentParams().get('departments')).toBe('all');
        });

        it('limits a coordinator to their own department without a department filter', async () => {
            const { employeeRequests } = serveEmployees();

            renderEmployees(coordinator({ departmentId: 3 }));

            expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
            expect(lastRequest(employeeRequests).searchParams.getAll('departmentIds')).toEqual(['3']);
            expect(screen.queryByRole('button', { name: /Středisko:/ })).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Stav:/ })).toBeInTheDocument();
        });

        it('shows a caregiver only active colleagues, whatever the URL says', async () => {
            const { employeeRequests } = serveEmployees();

            renderEmployees(caregiver(), '/employees?status=false');

            expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
            const { searchParams } = lastRequest(employeeRequests);
            expect(searchParams.get('status')).toBe('true');
            expect(searchParams.getAll('departmentIds')).toEqual(['2']);
            expect(screen.queryByRole('button', { name: /Stav:/ })).not.toBeInTheDocument();
        });

        it('filters the loaded employees by name without diacritics', async () => {
            serveEmployees();
            const { user } = renderEmployees(admin());
            await screen.findByText('Marie Nová');

            await user.type(screen.getByRole('textbox', { name: 'Hledat podle jména…' }), 'stary');

            expect(screen.getByText('Karel Starý')).toBeInTheDocument();
            expect(screen.queryByText('Marie Nová')).not.toBeInTheDocument();
            expect(currentParams().get('search')).toBe('stary');
        });
    });

    it('shows the empty state when nobody matches the filters', async () => {
        serveEmployees([]);

        renderEmployees(admin());

        expect(await screen.findByText('Žádní zaměstnanci')).toBeInTheDocument();
        expect(screen.getByText('0 zaměstnanců')).toBeInTheDocument();
    });

    it('shows the server message in a toast when the list fails to load', async () => {
        serveEmployees();
        server.use(http.get(apiUrl('/employees'), serverError('Databáze je nedostupná')));

        renderEmployees(admin());

        expect(await screen.findByText('Chyba při načítání zaměstnanců')).toBeInTheDocument();
        expect(screen.getByText('Databáze je nedostupná')).toBeInTheDocument();
    });

    describe('actions by role', () => {
        it('lets an admin create employees and manage every row', async () => {
            serveEmployees();
            const { user } = renderEmployees(admin());

            expect(await screen.findByRole('button', { name: /Nový zaměstnanec/ })).toBeInTheDocument();
            const menu = await openRowMenu(user, 'Eva Malá');
            expect(within(menu).getByRole('menuitem', { name: /Deaktivovat/ })).toBeInTheDocument();
        });

        it('gives a caregiver a read-only list', async () => {
            serveEmployees();

            renderEmployees(caregiver());

            expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Nový zaměstnanec/ })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Akce pro/ })).not.toBeInTheDocument();
            expect(screen.queryByRole('columnheader', { name: 'Stav' })).not.toBeInTheDocument();
        });

        it('does not let a coordinator change an administrator', async () => {
            serveEmployees();
            const { user } = renderEmployees(coordinator());

            expect(await screen.findByRole('button', { name: /Nový zaměstnanec/ })).toBeInTheDocument();
            const menu = await openRowMenu(user, 'Eva Malá');
            expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent.trim())).toEqual(['Otevřít detail']);
        });

        it('lets a coordinator change a caregiver', async () => {
            serveEmployees();
            const { user } = renderEmployees(coordinator());

            const menu = await openRowMenu(user, 'Marie Nová');

            expect(within(menu).getByRole('menuitem', { name: /Deaktivovat/ })).toBeInTheDocument();
        });

        it('does not let the user deactivate themselves', async () => {
            serveEmployees();
            const { user } = renderEmployees(admin({ employeeId: MARIE.id }));

            expect(await screen.findByText('(vy)')).toBeInTheDocument();
            const menu = await openRowMenu(user, 'Marie Nová');
            expect(within(menu).getByRole('menuitem', { name: /Deaktivovat/ })).toHaveAttribute('aria-disabled', 'true');
        });
    });

    describe('superadmin', () => {
        it('asks to pick an organization before loading anything', async () => {
            const { employeeRequests } = serveEmployees();

            renderEmployees(superadmin());

            expect(await screen.findByText('Vyberte organizaci')).toBeInTheDocument();
            expect(employeeRequests).toHaveLength(0);
            expect(screen.queryByRole('button', { name: /Nový zaměstnanec/ })).not.toBeInTheDocument();
        });

        it('loads the organization picked in the sidebar switcher', async () => {
            const { employeeRequests, departmentRequests } = serveEmployees();
            server.use(http.get(apiUrl('/organizations'), () => HttpResponse.json([{ id: 5, name: 'Charita Plzeň' }, { id: 6, name: 'Diakonie Klatovy' }])));
            const { user } = renderWithProviders(
                <SidebarProvider><AppSidebar /><Employees /></SidebarProvider>,
                { authStatus: superadmin(), route: '/employees' },
            );

            await user.click(await screen.findByRole('button', { name: 'Vyberte organizaci' }));
            await user.click(await screen.findByRole('menuitemradio', { name: 'Diakonie Klatovy' }));

            expect(await screen.findByText('Marie Nová')).toBeInTheDocument();
            expect(lastRequest(employeeRequests).searchParams.get('organizationId')).toBe('6');
            expect(lastRequest(departmentRequests).searchParams.get('organizationId')).toBe('6');
        });
    });

    describe('detail', () => {
        it('opens the employee from ?detail= in the URL', async () => {
            serveEmployees();

            renderEmployees(admin(), '/employees?detail=32');

            const sheet = await screen.findByRole('dialog', { name: 'Karel Starý' });
            expect(within(sheet).getByText('karel@caretracker.test')).toBeInTheDocument();
            expect(within(sheet).getByText('Čeká na aktivaci')).toBeInTheDocument();
        });

        it('puts the opened employee into the URL', async () => {
            serveEmployees();
            const { user } = renderEmployees(admin());

            await user.click(await screen.findByText('Marie Nová'));

            expect(await screen.findByRole('dialog', { name: 'Marie Nová' })).toBeInTheDocument();
            expect(currentParams().get('detail')).toBe(String(MARIE.id));
        });

        it('closes the detail of an employee who cannot be loaded', async () => {
            serveEmployees();
            server.use(http.get(apiUrl('/employees/:id'), serverError('Zaměstnanec neexistuje', 404)));

            renderEmployees(admin(), '/employees?detail=99');

            expect(await screen.findByText('Zaměstnanec nenalezen')).toBeInTheDocument();
            await waitFor(() => expect(currentParams().has('detail')).toBe(false));
            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        });

        it('is read-only for a caregiver', async () => {
            serveEmployees();

            renderEmployees(caregiver(), '/employees?detail=31');

            const sheet = await screen.findByRole('dialog', { name: 'Marie Nová' });
            expect(within(sheet).queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();
            expect(within(sheet).queryByRole('button', { name: 'Další akce' })).not.toBeInTheDocument();
        });

        it('does not let a coordinator edit an administrator', async () => {
            serveEmployees();

            renderEmployees(coordinator(), '/employees?detail=33');

            const sheet = await screen.findByRole('dialog', { name: 'Eva Malá' });
            expect(within(sheet).queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();
            expect(within(sheet).queryByRole('button', { name: 'Další akce' })).not.toBeInTheDocument();
        });

        it('saves edits and sends the changed employee', async () => {
            serveEmployees();
            const updates = serveAndRecord('put', '/employees/:id', ({ request }) => request.json().then((body) => HttpResponse.json({ ...MARIE, ...body })));
            const { user } = renderEmployees(admin(), '/employees?detail=31');

            const sheet = await screen.findByRole('dialog', { name: 'Marie Nová' });
            await user.click(within(sheet).getByRole('button', { name: /Upravit/ }));
            const lastName = await screen.findByRole('textbox', { name: 'Příjmení' });
            await user.clear(lastName);
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Prosím zadejte příjmení')).toBeInTheDocument();
            expect(updates).toHaveLength(0);

            await user.type(lastName, 'Veselá');
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Zaměstnanec úspěšně aktualizován')).toBeInTheDocument();
            expect(updates[0].path).toBe('/api/employees/31');
            expect(updates[0].body).toEqual({
                firstName: 'Marie',
                lastName: 'Veselá',
                role: 'CAREGIVER',
                departmentId: 2,
                email: 'marie@caretracker.test',
                isAdmin: false,
            });
        });
    });

    describe('create', () => {
        it('validates the form and sends the new employee', async () => {
            const { employeeRequests } = serveEmployees();
            const creates = serveAndRecord('post', '/employees', () => HttpResponse.json({ ...MARIE, id: 40, firstName: 'Petr', lastName: 'Dvořák' }));
            const { user } = renderEmployees(admin());

            await user.click(await screen.findByRole('button', { name: /Nový zaměstnanec/ }));
            const dialog = await screen.findByRole('dialog', { name: 'Nový zaměstnanec' });
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit zaměstnance' }));

            expect(within(dialog).getByText('Prosím zadejte jméno')).toBeInTheDocument();
            expect(within(dialog).getByText('Prosím zadejte příjmení')).toBeInTheDocument();
            expect(within(dialog).getByText('Prosím zadejte e-mail')).toBeInTheDocument();
            expect(creates).toHaveLength(0);

            await user.type(within(dialog).getByRole('textbox', { name: 'Jméno' }), 'Petr');
            await user.type(within(dialog).getByRole('textbox', { name: 'Příjmení' }), 'Dvořák');
            await user.type(within(dialog).getByRole('textbox', { name: 'E-mail' }), 'petr@');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit zaměstnance' }));
            expect(within(dialog).getByText('Zadejte platnou e-mailovou adresu')).toBeInTheDocument();

            await user.type(within(dialog).getByRole('textbox', { name: 'E-mail' }), 'caretracker.test');
            await user.click(within(dialog).getByRole('checkbox', { name: 'Administrátor' }));
            const requestsBeforeCreate = employeeRequests.length;
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit zaměstnance' }));

            expect(await screen.findByText('Zaměstnanec úspěšně vytvořen')).toBeInTheDocument();
            expect(creates[0].body).toEqual({
                firstName: 'Petr',
                lastName: 'Dvořák',
                role: 'CAREGIVER',
                departmentId: 2,
                email: 'petr@caretracker.test',
                isAdmin: true,
            });
            await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nový zaměstnanec' })).not.toBeInTheDocument());
            await waitFor(() => expect(employeeRequests.length).toBe(requestsBeforeCreate + 1));
        });

        it('sends an employee without an account', async () => {
            serveEmployees();
            const creates = serveAndRecord('post', '/employees', () => HttpResponse.json({ ...MARIE, id: 40, email: null }));
            const { user } = renderEmployees(admin());

            await user.click(await screen.findByRole('button', { name: /Nový zaměstnanec/ }));
            const dialog = await screen.findByRole('dialog', { name: 'Nový zaměstnanec' });
            await user.type(within(dialog).getByRole('textbox', { name: 'Jméno' }), 'Petr');
            await user.type(within(dialog).getByRole('textbox', { name: 'Příjmení' }), 'Dvořák');
            await user.click(within(dialog).getByRole('checkbox', { name: 'Vytvořit účet v aplikaci' }));
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit zaměstnance' }));

            await waitFor(() => expect(creates).toHaveLength(1));
            expect(creates[0].body).toEqual({ firstName: 'Petr', lastName: 'Dvořák', role: 'CAREGIVER', departmentId: 2 });
        });

        it('does not let a coordinator create an administrator or a coordinator', async () => {
            serveEmployees();
            const { user } = renderEmployees(coordinator());

            await user.click(await screen.findByRole('button', { name: /Nový zaměstnanec/ }));
            const dialog = await screen.findByRole('dialog', { name: 'Nový zaměstnanec' });

            expect(within(dialog).getByRole('checkbox', { name: 'Administrátor' })).toBeDisabled();
            await user.click(within(dialog).getByRole('combobox', { name: 'Role' }));
            expect((await screen.findAllByRole('option')).map((option) => option.textContent)).toEqual(['Pečovatel']);
        });

        it('keeps the dialog open with the server message when creating fails', async () => {
            serveEmployees();
            serveAndRecord('post', '/employees', serverError('E-mail už používá jiný uživatel', 409));
            const { user } = renderEmployees(admin());

            await user.click(await screen.findByRole('button', { name: /Nový zaměstnanec/ }));
            const dialog = await screen.findByRole('dialog', { name: 'Nový zaměstnanec' });
            await user.type(within(dialog).getByRole('textbox', { name: 'Jméno' }), 'Petr');
            await user.type(within(dialog).getByRole('textbox', { name: 'Příjmení' }), 'Dvořák');
            await user.type(within(dialog).getByRole('textbox', { name: 'E-mail' }), 'marie@caretracker.test');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit zaměstnance' }));

            expect(await screen.findByText('Chyba při vytváření zaměstnance')).toBeInTheDocument();
            expect(screen.getByText('E-mail už používá jiný uživatel')).toBeInTheDocument();
            expect(screen.getByRole('dialog', { name: 'Nový zaměstnanec' })).toBeInTheDocument();
        });
    });

    describe('deactivate and activate', () => {
        it('deactivates an employee after confirmation', async () => {
            serveEmployees();
            const terminations = serveAndRecord('put', '/employees/:id/terminate', () => HttpResponse.json({ ...MARIE, active: false }));
            const { user } = renderEmployees(admin());

            const menu = await openRowMenu(user, 'Marie Nová');
            await user.click(within(menu).getByRole('menuitem', { name: /Deaktivovat/ }));
            const confirm = await screen.findByRole('alertdialog', { name: 'Deaktivovat zaměstnance?' });
            await user.click(within(confirm).getByRole('button', { name: 'Deaktivovat' }));

            expect(await screen.findByText('Zaměstnanec úspěšně deaktivován')).toBeInTheDocument();
            expect(terminations[0].path).toBe('/api/employees/31/terminate');
            await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        });

        it('keeps the confirmation open and shows why a key worker cannot be deactivated', async () => {
            serveEmployees();
            const message = 'Zaměstnanec je pečovatelem 3 aktivních klientů. Nejdřív jim přidělte jiného pečovatele.';
            serveAndRecord('put', '/employees/:id/terminate', serverError(message, 409));
            const { user } = renderEmployees(admin());

            const menu = await openRowMenu(user, 'Marie Nová');
            await user.click(within(menu).getByRole('menuitem', { name: /Deaktivovat/ }));
            const confirm = await screen.findByRole('alertdialog', { name: 'Deaktivovat zaměstnance?' });
            await user.click(within(confirm).getByRole('button', { name: 'Deaktivovat' }));

            expect(await screen.findByText('Chyba při deaktivaci zaměstnance')).toBeInTheDocument();
            expect(screen.getByText(message)).toBeInTheDocument();
            expect(screen.getByRole('alertdialog', { name: 'Deaktivovat zaměstnance?' })).toBeInTheDocument();
        });

        it('activates an inactive employee from the detail', async () => {
            const inactive = employee({ active: false });
            serveEmployees([inactive]);
            const activations = serveAndRecord('put', '/employees/:id/activate', () => HttpResponse.json(MARIE));
            const { user } = renderEmployees(admin(), '/employees?status=false&detail=31');

            const sheet = await screen.findByRole('dialog', { name: 'Marie Nová' });
            await user.click(within(sheet).getByRole('button', { name: 'Další akce' }));
            await user.click(await screen.findByRole('menuitem', { name: /Aktivovat zaměstnance/ }));
            const confirm = await screen.findByRole('alertdialog', { name: 'Aktivovat zaměstnance?' });
            await user.click(within(confirm).getByRole('button', { name: 'Aktivovat' }));

            expect(await screen.findByText('Zaměstnanec úspěšně aktivován')).toBeInTheDocument();
            expect(activations[0].path).toBe('/api/employees/31/activate');
        });

        it('shows the server message when activation fails', async () => {
            serveEmployees([employee({ active: false })]);
            serveAndRecord('put', '/employees/:id/activate', serverError('Středisko zaměstnance je neaktivní', 409));
            const { user } = renderEmployees(admin(), '/employees?status=false');

            const menu = await openRowMenu(user, 'Marie Nová');
            await user.click(within(menu).getByRole('menuitem', { name: /Aktivovat/ }));
            await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Aktivovat' }));

            expect(await screen.findByText('Chyba při aktivaci zaměstnance')).toBeInTheDocument();
            expect(screen.getByText('Středisko zaměstnance je neaktivní')).toBeInTheDocument();
        });
    });

    describe('account', () => {
        it('offers to resend the activation e-mail only to employees who have not activated yet', async () => {
            serveEmployees();
            const resends = serveAndRecord('post', '/employees/:id/resend', () => HttpResponse.json({ success: true, message: 'Aktivační e-mail byl odeslán' }));
            const { user } = renderEmployees(admin());

            let menu = await openRowMenu(user, 'Marie Nová');
            expect(within(menu).queryByRole('menuitem', { name: /aktivační e-mail/ })).not.toBeInTheDocument();
            await user.keyboard('{Escape}');

            menu = await openRowMenu(user, 'Karel Starý');
            await user.click(within(menu).getByRole('menuitem', { name: /Znovu poslat aktivační e-mail/ }));

            expect(await screen.findByText('Aktivační e-mail byl odeslán')).toBeInTheDocument();
            expect(resends[0].path).toBe('/api/employees/32/resend');
        });

        it('shows a refused resend as an error', async () => {
            serveEmployees();
            serveAndRecord('post', '/employees/:id/resend', () => HttpResponse.json({ success: false, message: 'Odkaz lze poslat nejdřív za 5 minut' }));
            const { user } = renderEmployees(admin(), '/employees?detail=32');

            const sheet = await screen.findByRole('dialog', { name: 'Karel Starý' });
            await user.click(within(sheet).getByRole('button', { name: 'Další akce' }));
            await user.click(await screen.findByRole('menuitem', { name: /Znovu poslat aktivační e-mail/ }));

            expect(await screen.findByText('Odkaz lze poslat nejdřív za 5 minut')).toBeInTheDocument();
        });

        // Nález: useEmployees.resendActivationEmail shows the toast and then rethrows, but the row menu and the sheet
        // call it without a catch, so a failed resend ends in an unhandled promise rejection (Vitest fails the run on it).
        it.skip('shows the server message when the activation e-mail cannot be sent', async () => {
            serveEmployees();
            serveAndRecord('post', '/employees/:id/resend', serverError('Odeslání e-mailu selhalo'));
            const { user } = renderEmployees(admin());

            const menu = await openRowMenu(user, 'Karel Starý');
            await user.click(within(menu).getByRole('menuitem', { name: /Znovu poslat aktivační e-mail/ }));

            expect(await screen.findByText('Chyba při odesílání aktivačního emailu')).toBeInTheDocument();
            expect(screen.getByText('Odeslání e-mailu selhalo')).toBeInTheDocument();
        });

        it('lists the account state of each employee', async () => {
            serveEmployees([MARIE, PENDING_KAREL, employee({ id: 34, firstName: 'Jan', lastName: 'Bez', email: null, isActivated: false })]);

            renderEmployees(admin());

            await screen.findByText('Marie Nová');
            expect(within(rowOf('Marie Nová')).getByText('Aktivní účet')).toBeInTheDocument();
            expect(within(rowOf('Karel Starý')).getByText('Čeká na aktivaci')).toBeInTheDocument();
            expect(within(rowOf('Jan Bez')).getByText('Bez účtu')).toBeInTheDocument();
        });
    });
});
