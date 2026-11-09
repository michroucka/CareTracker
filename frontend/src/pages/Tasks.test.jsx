import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import Tasks from './Tasks';
import { serveAndRecord, serverError } from '@/test/hooks';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { admin, caregiver, coordinator, superadmin } from '@/test/users';

function task(overrides = {}) {
    return { id: 11, name: 'Nákup', unitType: 'HOUR', unitPrice: 150, doubleMeeting: false, active: true, ...overrides };
}

const SHOPPING = task();
const TRANSPORT = task({ id: 12, name: 'Doprava', unitType: 'KM', unitPrice: 12 });
const BATHING = task({ id: 13, name: 'Koupel', unitType: 'OCCURRENCE', unitPrice: 90, doubleMeeting: true });

function serveTasks(tasks = [SHOPPING, TRANSPORT, BATHING]) {
    const taskRequests = serveAndRecord('get', '/tasks', () => HttpResponse.json(tasks));
    server.use(http.get(apiUrl('/tasks/:id'), ({ params }) => HttpResponse.json(tasks.find((item) => item.id === Number(params.id)))));
    return taskRequests;
}

const renderTasks = (authStatus, route = '/tasks') => renderWithProviders(<Tasks />, { authStatus, route });

const currentParams = () => new URLSearchParams(window.location.search);

function asSuperadminOf(organization) {
    localStorage.setItem('superadmin_org', JSON.stringify(organization));
    return superadmin();
}

async function openCreateDialog(user) {
    await user.click(await screen.findByRole('button', { name: /Nový úkon/ }));
    return screen.findByRole('dialog', { name: 'Nový úkon' });
}

describe('Tasks', () => {
    describe('filters', () => {
        it('loads the active catalog by default and keeps the status in the URL', async () => {
            const taskRequests = serveTasks();

            renderTasks(admin());

            expect(await screen.findByText('Nákup')).toBeInTheDocument();
            expect(taskRequests.at(-1).searchParams.get('status')).toBe('true');
            expect(currentParams().get('status')).toBe('true');
            expect(screen.getByText('3 úkony')).toBeInTheDocument();
        });

        it('restores the status filter from the URL', async () => {
            const taskRequests = serveTasks();

            renderTasks(admin(), '/tasks?status=all&search=dop');

            expect(await screen.findByText('Doprava')).toBeInTheDocument();
            expect(taskRequests.at(-1).searchParams.has('status')).toBe(false);
            expect(screen.getByRole('button', { name: /Stav:/ })).toHaveTextContent('Všechny');
            expect(screen.getByRole('textbox', { name: 'Hledat podle názvu…' })).toHaveValue('dop');
            expect(screen.queryByText('Nákup')).not.toBeInTheDocument();
        });

        it('asks for inactive tasks when the status filter changes', async () => {
            const taskRequests = serveTasks();
            const { user } = renderTasks(admin());
            await screen.findByText('Nákup');

            await user.click(screen.getByRole('button', { name: /Stav:/ }));
            await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Neaktivní' }));

            await waitFor(() => expect(taskRequests.at(-1).searchParams.has('status')).toBe(false));
            expect(currentParams().get('status')).toBe('all');
        });

        it('shows the catalog sorted by name with units and prices', async () => {
            serveTasks();

            renderTasks(admin());

            await screen.findByText('Nákup');
            const names = screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent);
            expect(names).toEqual(['Doprava', 'Koupel', 'Nákup']);
            const transport = screen.getByText('Doprava').closest('tr');
            expect(within(transport).getByText('Kilometr')).toBeInTheDocument();
            expect(within(transport).getByText('12 Kč / km')).toBeInTheDocument();
            expect(within(screen.getByText('Koupel').closest('tr')).getByText('Dvojité')).toBeInTheDocument();
        });
    });

    it('shows the empty catalog with a create button for an admin', async () => {
        serveTasks([]);

        renderTasks(admin());

        expect(await screen.findByText('Katalog je prázdný')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Nový úkon/ })).toHaveLength(2);
    });

    it('shows a no-match state for a search with a way back', async () => {
        serveTasks();
        const { user } = renderTasks(admin(), '/tasks?search=xyz');

        expect(await screen.findByText('Žádný úkon neodpovídá hledání')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Zrušit hledání' }));

        expect(screen.getByText('Nákup')).toBeInTheDocument();
        expect(currentParams().has('search')).toBe(false);
    });

    it('shows the server message in a toast when the catalog fails to load', async () => {
        server.use(http.get(apiUrl('/tasks'), serverError('Databáze je nedostupná')));

        renderTasks(admin());

        expect(await screen.findByText('Chyba při načítání úkolů')).toBeInTheDocument();
        expect(screen.getByText('Databáze je nedostupná')).toBeInTheDocument();
    });

    describe('actions by role', () => {
        it('lets an admin create and deactivate tasks', async () => {
            serveTasks();
            const { user } = renderTasks(admin());

            expect(await screen.findByRole('button', { name: /Nový úkon/ })).toBeInTheDocument();
            await user.click(await screen.findByRole('button', { name: 'Akce pro úkon Nákup' }));
            expect(await screen.findByRole('menuitem', { name: /Deaktivovat/ })).toBeInTheDocument();
        });

        it.each([
            ['coordinator', coordinator],
            ['caregiver', caregiver],
        ])('gives a %s the active catalog read-only', async (_, role) => {
            const taskRequests = serveTasks();

            renderTasks(role(), '/tasks?status=false');

            expect(await screen.findByText('Nákup')).toBeInTheDocument();
            expect(taskRequests.at(-1).searchParams.get('status')).toBe('true');
            expect(screen.queryByRole('button', { name: /Nový úkon/ })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Stav:/ })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Akce pro úkon/ })).not.toBeInTheDocument();
        });

        it('does not offer creating into an empty catalog to a caregiver', async () => {
            serveTasks([]);

            renderTasks(caregiver());

            expect(await screen.findByText('Katalog je prázdný')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Nový úkon/ })).not.toBeInTheDocument();
        });
    });

    describe('superadmin', () => {
        it('asks to pick an organization first', async () => {
            const taskRequests = serveTasks();

            renderTasks(superadmin());

            expect(await screen.findByText('Vyberte organizaci')).toBeInTheDocument();
            expect(taskRequests).toHaveLength(0);
            expect(screen.queryByRole('button', { name: /Nový úkon/ })).not.toBeInTheDocument();
        });

        it('loads and creates tasks in the selected organization', async () => {
            const taskRequests = serveTasks();
            const creates = serveAndRecord('post', '/tasks', () => HttpResponse.json(task({ id: 20, name: 'Úklid' })));
            const { user } = renderTasks(asSuperadminOf({ id: 5, name: 'Charita Plzeň' }));

            expect(await screen.findByText('Nákup')).toBeInTheDocument();
            expect(taskRequests.at(-1).searchParams.get('organizationId')).toBe('5');

            const dialog = await openCreateDialog(user);
            await user.type(within(dialog).getByRole('textbox', { name: 'Název' }), 'Úklid');
            await user.type(within(dialog).getByRole('textbox', { name: 'Cena' }), '200');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit úkon' }));

            await waitFor(() => expect(creates).toHaveLength(1));
            expect(creates[0].body.organizationId).toBe(5);
        });
    });

    describe('detail', () => {
        it('opens the task from ?detail= in the URL', async () => {
            serveTasks();

            renderTasks(admin(), '/tasks?detail=13');

            const sheet = await screen.findByRole('dialog', { name: 'Koupel' });
            expect(within(sheet).getByText('90 Kč / úkon')).toBeInTheDocument();
            expect(within(sheet).getByText('Dvojité setkání')).toBeInTheDocument();
            expect(within(sheet).getByRole('button', { name: /Upravit/ })).toBeInTheDocument();
        });

        it('puts the opened task into the URL', async () => {
            serveTasks();
            const { user } = renderTasks(admin());

            await user.click(await screen.findByText('Doprava'));

            expect(await screen.findByRole('dialog', { name: 'Doprava' })).toBeInTheDocument();
            expect(currentParams().get('detail')).toBe('12');
        });

        it('is read-only for a coordinator', async () => {
            serveTasks();

            renderTasks(coordinator(), '/tasks?detail=11');

            const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
            expect(within(sheet).queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();
            expect(within(sheet).queryByRole('button', { name: 'Další akce' })).not.toBeInTheDocument();
        });

        it('validates and saves edits', async () => {
            serveTasks();
            const updates = serveAndRecord('put', '/tasks/:id', ({ request }) => request.json().then((body) => HttpResponse.json({ ...SHOPPING, ...body })));
            const { user } = renderTasks(admin(), '/tasks?detail=11');

            const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
            await user.click(within(sheet).getByRole('button', { name: /Upravit/ }));
            const price = await screen.findByRole('textbox', { name: 'Cena' });
            await user.clear(price);
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));
            expect(await screen.findByText('Prosím zadejte cenu')).toBeInTheDocument();

            await user.type(price, '0');
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));
            expect(await screen.findByText('Cena musí být větší než 0')).toBeInTheDocument();
            expect(updates).toHaveLength(0);

            await user.clear(price);
            await user.type(price, '18 Kč');
            await user.click(screen.getByRole('checkbox', { name: 'Dvojité setkání' }));
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Úkon úspěšně aktualizován')).toBeInTheDocument();
            expect(updates[0].path).toBe('/api/tasks/11');
            expect(updates[0].body).toEqual({ name: 'Nákup', unitType: 'HOUR', unitPrice: 18, doubleMeeting: true, organizationId: null });
            expect(await within(sheet).findByText('18 Kč / hod')).toBeInTheDocument();
        });

        it('keeps the form open with the server message when saving fails', async () => {
            serveTasks();
            serveAndRecord('put', '/tasks/:id', serverError('Úkon se stejným názvem už existuje', 409));
            const { user } = renderTasks(admin(), '/tasks?detail=11');

            const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
            await user.click(within(sheet).getByRole('button', { name: /Upravit/ }));
            // the edit form replaces the view only after the crossfade, the footer button is there sooner
            await screen.findByRole('textbox', { name: 'Název' });
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Chyba při aktualizaci úkonu')).toBeInTheDocument();
            expect(screen.getByText('Úkon se stejným názvem už existuje')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeInTheDocument();
        });
    });

    describe('create', () => {
        it('validates the form and sends the new task', async () => {
            serveTasks();
            const creates = serveAndRecord('post', '/tasks', () => HttpResponse.json(task({ id: 20, name: 'Úklid', unitType: 'KG', unitPrice: 30 })));
            const { user } = renderTasks(admin());

            const dialog = await openCreateDialog(user);
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit úkon' }));
            expect(within(dialog).getByText('Prosím zadejte název')).toBeInTheDocument();
            expect(within(dialog).getByText('Prosím zadejte cenu')).toBeInTheDocument();
            expect(creates).toHaveLength(0);

            await user.type(within(dialog).getByRole('textbox', { name: 'Název' }), '  Úklid ');
            await user.click(within(dialog).getByRole('combobox', { name: 'Jednotka' }));
            await user.click(await screen.findByRole('option', { name: 'Kilogram' }));
            await user.type(within(dialog).getByRole('textbox', { name: 'Cena' }), '30');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit úkon' }));

            expect(await screen.findByText('Úkon úspěšně vytvořen')).toBeInTheDocument();
            expect(creates[0].body).toEqual({ name: 'Úklid', unitType: 'KG', unitPrice: 30, doubleMeeting: false, organizationId: null });
            expect(await screen.findByText('Úklid')).toBeInTheDocument();
            await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nový úkon' })).not.toBeInTheDocument());
        });

        it('keeps the dialog open with the server message when creating fails', async () => {
            serveTasks();
            serveAndRecord('post', '/tasks', serverError('Úkon se stejným názvem už existuje', 409));
            const { user } = renderTasks(admin());

            const dialog = await openCreateDialog(user);
            await user.type(within(dialog).getByRole('textbox', { name: 'Název' }), 'Nákup');
            await user.type(within(dialog).getByRole('textbox', { name: 'Cena' }), '150');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit úkon' }));

            expect(await screen.findByText('Chyba při vytváření úkonu')).toBeInTheDocument();
            expect(screen.getByText('Úkon se stejným názvem už existuje')).toBeInTheDocument();
            expect(screen.getByRole('dialog', { name: 'Nový úkon' })).toBeInTheDocument();
        });

        // Nález: useTasks.createTask appends the new (active) task to whatever list is shown, so with
        // "Stav: Neaktivní" it appears among inactive tasks until the next reload.
        it.skip('does not add a new active task to the list of inactive tasks', async () => {
            serveTasks([task({ id: 14, name: 'Žehlení', active: false })]);
            serveAndRecord('post', '/tasks', () => HttpResponse.json(task({ id: 20, name: 'Úklid' })));
            const { user } = renderTasks(admin(), '/tasks?status=false');
            await screen.findByText('Žehlení');

            const dialog = await openCreateDialog(user);
            await user.type(within(dialog).getByRole('textbox', { name: 'Název' }), 'Úklid');
            await user.type(within(dialog).getByRole('textbox', { name: 'Cena' }), '200');
            await user.click(within(dialog).getByRole('button', { name: 'Vytvořit úkon' }));

            expect(await screen.findByText('Úkon úspěšně vytvořen')).toBeInTheDocument();
            expect(screen.queryByRole('cell', { name: 'Úklid' })).not.toBeInTheDocument();
        });
    });

    describe('deactivate and activate', () => {
        it('deactivates a task after confirmation', async () => {
            serveTasks();
            const terminations = serveAndRecord('put', '/tasks/:id/terminate', () => HttpResponse.json(task({ active: false })));
            const { user } = renderTasks(admin());

            await user.click(await screen.findByRole('button', { name: 'Akce pro úkon Nákup' }));
            await user.click(await screen.findByRole('menuitem', { name: /Deaktivovat/ }));
            const confirm = await screen.findByRole('alertdialog', { name: 'Deaktivovat úkon?' });
            expect(confirm).toHaveTextContent('Úkon Nákup už nepůjde zapisovat.');
            await user.click(within(confirm).getByRole('button', { name: 'Deaktivovat' }));

            expect(await screen.findByText('Úkon úspěšně deaktivován')).toBeInTheDocument();
            expect(terminations[0].path).toBe('/api/tasks/11/terminate');
        });

        it('keeps the confirmation open and shows the server message when deactivation fails', async () => {
            serveTasks();
            serveAndRecord('put', '/tasks/:id/terminate', serverError('Úkon je v individuálním plánu aktivního klienta', 409));
            const { user } = renderTasks(admin(), '/tasks?detail=11');

            const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
            await user.click(within(sheet).getByRole('button', { name: 'Další akce' }));
            await user.click(await screen.findByRole('menuitem', { name: /Deaktivovat úkon/ }));
            const confirm = await screen.findByRole('alertdialog', { name: 'Deaktivovat úkon?' });
            await user.click(within(confirm).getByRole('button', { name: 'Deaktivovat' }));

            expect(await screen.findByText('Chyba při deaktivaci úkonu')).toBeInTheDocument();
            expect(screen.getByText('Úkon je v individuálním plánu aktivního klienta')).toBeInTheDocument();
            expect(screen.getByRole('alertdialog', { name: 'Deaktivovat úkon?' })).toBeInTheDocument();
        });

        it('activates an inactive task and refreshes the open detail', async () => {
            let shopping = task({ active: false });
            serveAndRecord('get', '/tasks', () => HttpResponse.json([shopping]));
            server.use(http.get(apiUrl('/tasks/:id'), () => HttpResponse.json(shopping)));
            serveAndRecord('put', '/tasks/:id/activate', () => {
                shopping = task();
                return HttpResponse.json(shopping);
            });
            const { user } = renderTasks(admin(), '/tasks?status=all&detail=11');

            const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
            expect(within(sheet).getByText('Neaktivní')).toBeInTheDocument();
            await user.click(within(sheet).getByRole('button', { name: 'Další akce' }));
            await user.click(await screen.findByRole('menuitem', { name: /Aktivovat úkon/ }));
            await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Aktivovat' }));

            expect(await screen.findByText('Úkon úspěšně aktivován')).toBeInTheDocument();
            await waitFor(() => expect(within(sheet).queryByText('Neaktivní')).not.toBeInTheDocument());
        });
    });
});
