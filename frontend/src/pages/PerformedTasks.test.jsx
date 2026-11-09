import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PerformedTasks from './PerformedTasks';
import { formatCurrency } from '@/components/dashboard/dashboardFormat';
import { calculatePrice } from '@/constants/performedTaskConstants';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { currentSearchParams, serveAndRecord, serverError } from '@/test/hooks';
import { admin, caregiver, coordinator, superadmin } from '@/test/users';

const PLZEN = { id: 2, city: 'Plzeň' };
const KLATOVY = { id: 3, city: 'Klatovy' };

const JANA = { id: 10, firstName: 'Jana', lastName: 'Testová', department: PLZEN };
const PETR = { id: 11, firstName: 'Petr', lastName: 'Svoboda', department: PLZEN };
const EVA = { id: 12, firstName: 'Eva', lastName: 'Černá', department: KLATOVY };

const SHOPPING = { id: 1, name: 'Nákup', unitType: 'OCCURRENCE', unitPrice: 100 };
const ESCORT = { id: 2, name: 'Doprovod', unitType: 'HOUR', unitPrice: 130 };
const TRANSPORT = { id: 3, name: 'Doprava', unitType: 'KM', unitPrice: 8 };

const MARIE = { id: 7, firstName: 'Marie', lastName: 'Nová', street: 'Americká 12', city: 'Plzeň', department: PLZEN, tasks: [{ id: SHOPPING.id }, { id: ESCORT.id }] };
const KAREL = { id: 8, firstName: 'Karel', lastName: 'Starý', street: 'Husova 3', city: 'Plzeň', department: PLZEN, tasks: [] };

const shoppingForMarie = {
    id: 100,
    date: '2026-11-03T09:30:00',
    clientName: 'Marie Nová',
    taskName: 'Nákup',
    unitCount: 2,
    unitType: 'OCCURRENCE',
    price: 200,
    department: PLZEN,
    caregivers: [{ id: JANA.id, fullName: 'Jana Testová' }],
};

const escortForKarel = {
    id: 101,
    date: '2026-11-05T14:00:00',
    clientName: 'Karel Starý',
    taskName: 'Doprovod',
    unitCount: 90,
    unitType: 'HOUR',
    price: 195,
    department: PLZEN,
    caregivers: [{ id: PETR.id, fullName: 'Petr Svoboda' }],
};

const shoppingDetail = {
    id: 100,
    date: '2026-11-03T09:30:00',
    unitCount: 2,
    notes: 'Mléko a chleba',
    task: SHOPPING,
    client: { id: MARIE.id, fullName: 'Marie Nová' },
    caregivers: [{ id: JANA.id, fullName: 'Jana Testová' }],
    department: PLZEN,
};

const escortDetail = {
    id: 101,
    date: '2026-11-05T14:00:00',
    unitCount: 90,
    notes: null,
    task: ESCORT,
    client: { id: KAREL.id, fullName: 'Karel Starý' },
    caregivers: [{ id: PETR.id, fullName: 'Petr Svoboda' }],
    department: PLZEN,
};

// Monday 9 November 2026, 10:02: the form starts on today and 10:00
const NOW = new Date(2026, 10, 9, 10, 2);

/** Serves the filter and form options; returns the recorded requests per endpoint. */
function serveOptions({ employees = [JANA, PETR, EVA], clients = [MARIE, KAREL], tasks = [SHOPPING, ESCORT, TRANSPORT] } = {}) {
    return {
        departments: serveAndRecord('get', '/departments', () => HttpResponse.json([PLZEN, KLATOVY])),
        employees: serveAndRecord('get', '/employees', () => HttpResponse.json(employees)),
        clients: serveAndRecord('get', '/clients', () => HttpResponse.json(clients)),
        tasks: serveAndRecord('get', '/tasks', () => HttpResponse.json(tasks)),
    };
}

function servePerformedTasks(records = [shoppingForMarie, escortForKarel]) {
    return serveAndRecord('get', '/performed-tasks', () => HttpResponse.json(records));
}

function serveDetails() {
    server.use(
        http.get(apiUrl('/performed-tasks/100'), () => HttpResponse.json(shoppingDetail)),
        http.get(apiUrl('/performed-tasks/101'), () => HttpResponse.json(escortDetail)),
    );
}

function renderPage({ authStatus = admin(), route = '/performed-tasks' } = {}) {
    return renderWithProviders(<PerformedTasks />, { authStatus, route });
}

// Testing Library collapses the no-break space in "200 Kč" when it reads the page, but not in the expected text
const price = (value) => formatCurrency(value).replace(/\s/g, ' ');

const lastRequest = (requests) => requests.at(-1);
const allParams = (request, name) => request.searchParams.getAll(name);

const recordRow = (clientName) => screen.getByRole('row', { name: new RegExp(clientName) });
const findRecordRow = (clientName) => screen.findByRole('row', { name: new RegExp(clientName) });

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
});

afterEach(() => {
    vi.useRealTimers();
});

describe('PerformedTasks list', () => {
    it("loads the current month of the admin's department and keeps the filters in the URL", async () => {
        const options = serveOptions();
        const requests = servePerformedTasks();

        renderPage();

        expect(await findRecordRow('Marie Nová')).toBeInTheDocument();
        expect(recordRow('Karel Starý')).toBeInTheDocument();
        expect(screen.getByText(/2 záznamy/)).toHaveTextContent(price(395));

        const request = lastRequest(requests);
        expect(request.searchParams.get('month')).toBe('11');
        expect(request.searchParams.get('year')).toBe('2026');
        expect(allParams(request, 'departmentIds')).toEqual(['2']);
        expect(request.searchParams.has('caregiverIds')).toBe(false);

        // inactive tasks, clients and caregivers are not offered in filters or forms
        for (const endpoint of Object.values(options)) {
            expect(lastRequest(endpoint).searchParams.get('status')).toBe('true');
        }

        const url = currentSearchParams();
        expect(url.get('month')).toBe('11');
        expect(url.get('year')).toBe('2026');
        expect(url.get('departments')).toBe('2');
        expect(url.get('caregivers')).toBe('all');
    });

    it('restores the month, departments, caregivers, day and search from the URL', async () => {
        serveOptions();
        const marchRecords = [
            { ...shoppingForMarie, date: '2026-03-05T08:00:00' },
            { ...escortForKarel, date: '2026-03-12T10:00:00' },
        ];
        const requests = servePerformedTasks(marchRecords);

        renderPage({ route: '/performed-tasks?month=3&year=2026&departments=2,3&caregivers=11&day=2026-03-05&search=marie' });

        expect(await findRecordRow('Marie Nová')).toBeInTheDocument();
        expect(screen.queryByRole('row', { name: /Karel Starý/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Březen 2026' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Den:/ })).toHaveTextContent('5. 3.');
        expect(screen.getByPlaceholderText('Hledat podle klienta nebo úkonu…')).toHaveValue('marie');

        const request = lastRequest(requests);
        expect(request.searchParams.get('month')).toBe('3');
        expect(allParams(request, 'departmentIds')).toEqual(['2', '3']);
        expect(allParams(request, 'caregiverIds')).toEqual(['11']);
    });

    it('switches months with the arrows and asks for the new month', async () => {
        serveOptions();
        const requests = servePerformedTasks();
        const { user } = renderPage();
        await findRecordRow('Marie Nová');

        expect(screen.getByRole('button', { name: 'Další měsíc' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Předchozí měsíc' }));

        await waitFor(() => expect(lastRequest(requests).searchParams.get('month')).toBe('10'));
        expect(lastRequest(requests).searchParams.get('year')).toBe('2026');
        expect(currentSearchParams().get('month')).toBe('10');
        // the records of November do not belong to October
        expect(await screen.findByText('V tomto měsíci zatím nic')).toBeInTheDocument();
    });

    it('narrows the month to one day with the day filter', async () => {
        serveOptions();
        servePerformedTasks();
        const { user } = renderPage();
        await findRecordRow('Marie Nová');

        await user.click(screen.getByRole('button', { name: /Den:/ }));
        expect(screen.getByRole('button', { name: /^středa, 4. listopadu 2026/ })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: /^čtvrtek, 5. listopadu 2026/ }));

        expect(recordRow('Karel Starý')).toBeInTheDocument();
        expect(screen.queryByRole('row', { name: /Marie Nová/ })).not.toBeInTheDocument();
        expect(currentSearchParams().get('day')).toBe('2026-11-05');

        await user.click(screen.getByRole('button', { name: 'Zobrazit celý měsíc' }));
        expect(recordRow('Marie Nová')).toBeInTheDocument();
        expect(currentSearchParams().has('day')).toBe(false);
    });

    it('filters by caregiver and department', async () => {
        serveOptions();
        const requests = servePerformedTasks();
        const { user } = renderPage();
        await findRecordRow('Marie Nová');

        await user.click(screen.getByRole('button', { name: /Pečovatel:/ }));
        // only caregivers of the selected department are offered
        expect(screen.queryByRole('option', { name: 'Eva Černá' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('option', { name: 'Petr Svoboda' }));

        await waitFor(() => expect(allParams(lastRequest(requests), 'caregiverIds')).toEqual(['11']));
        expect(currentSearchParams().get('caregivers')).toBe('11');
        await user.keyboard('{Escape}');

        await user.click(screen.getByRole('button', { name: /Středisko:/ }));
        await user.click(screen.getByRole('option', { name: 'Klatovy' }));

        await waitFor(() => expect(allParams(lastRequest(requests), 'departmentIds')).toEqual(['2', '3']));
        expect(currentSearchParams().get('departments')).toBe('2,3');
    });

    it("does not let a coordinator choose departments and loads the coordinator's own", async () => {
        serveOptions();
        const requests = servePerformedTasks();

        renderPage({ authStatus: coordinator({ departmentId: 3 }) });

        await findRecordRow('Marie Nová');
        expect(screen.queryByRole('button', { name: /Středisko:/ })).not.toBeInTheDocument();
        expect(allParams(lastRequest(requests), 'departmentIds')).toEqual(['3']);
    });

    it('shows the empty month with a way to record a task', async () => {
        serveOptions();
        servePerformedTasks([]);

        renderPage();

        expect(await screen.findByText('V tomto měsíci zatím nic')).toBeInTheDocument();
        expect(screen.getByText(/0 záznamů/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Den:/ })).toBeDisabled();
    });

    it('offers to cancel a search that matches nothing', async () => {
        serveOptions();
        servePerformedTasks();
        const { user } = renderPage({ route: '/performed-tasks?search=xyz' });

        expect(await screen.findByText('Žádný záznam neodpovídá hledání')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Zrušit hledání' }));

        expect(recordRow('Marie Nová')).toBeInTheDocument();
    });

    it('shows a toast when the records cannot be loaded', async () => {
        serveOptions();
        serveAndRecord('get', '/performed-tasks', serverError('Databáze neodpovídá'));

        renderPage();

        expect(await screen.findByText('Chyba při načítání provedených úkonů')).toBeInTheDocument();
        expect(screen.getByText('Databáze neodpovídá')).toBeInTheDocument();
    });

    it('asks a superadmin to pick an organization first', async () => {
        serveOptions();
        const requests = servePerformedTasks();

        renderPage({ authStatus: superadmin() });

        expect(await screen.findByText('Vyberte organizaci')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Zapsat úkon/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Stvrzenka/ })).not.toBeInTheDocument();
        expect(requests).toHaveLength(0);
    });

    describe('actions by role', () => {
        const openRowMenu = async (user, record) => {
            await user.click(screen.getByRole('button', { name: `Akce pro záznam ${record.taskName} u klienta ${record.clientName}` }));
            return screen.getByRole('menu');
        };

        it('lets a caregiver delete only records they took part in', async () => {
            serveOptions();
            servePerformedTasks();
            const { user } = renderPage({ authStatus: caregiver({ employeeId: JANA.id }) });
            await findRecordRow('Marie Nová');

            expect(screen.getByRole('button', { name: /Zapsat úkon/ })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Stvrzenka/ })).toBeInTheDocument();

            let menu = await openRowMenu(user, shoppingForMarie);
            expect(within(menu).getByRole('menuitem', { name: /Smazat záznam/ })).toBeInTheDocument();
            await user.keyboard('{Escape}');

            menu = await openRowMenu(user, escortForKarel);
            expect(within(menu).getByRole('menuitem', { name: /Otevřít detail/ })).toBeInTheDocument();
            expect(within(menu).queryByRole('menuitem', { name: /Smazat záznam/ })).not.toBeInTheDocument();
        });

        it("lets a coordinator delete anyone's record after confirming", async () => {
            serveOptions();
            servePerformedTasks();
            const deletes = serveAndRecord('delete', '/performed-tasks/:id', () => new HttpResponse(null, { status: 204 }));
            const { user } = renderPage({ authStatus: coordinator({ employeeId: 99 }) });
            await findRecordRow('Karel Starý');

            const menu = await openRowMenu(user, escortForKarel);
            await user.click(within(menu).getByRole('menuitem', { name: /Smazat záznam/ }));
            const dialog = screen.getByRole('alertdialog', { name: 'Smazat záznam úkonu?' });
            expect(dialog).toHaveTextContent('Doprovod u klienta Karel Starý');
            await user.click(within(dialog).getByRole('button', { name: 'Smazat' }));

            expect(await screen.findByText('Úkon úspěšně odstraněn')).toBeInTheDocument();
            expect(deletes).toHaveLength(1);
            expect(deletes[0].path).toMatch(/\/performed-tasks\/101$/);
            expect(screen.queryByRole('row', { name: /Karel Starý/ })).not.toBeInTheDocument();
        });
    });

    describe('detail', () => {
        it('opens the detail from ?detail= and closes it back to the list', async () => {
            serveOptions();
            servePerformedTasks();
            serveDetails();
            const { user } = renderPage({ route: '/performed-tasks?detail=100' });

            const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
            expect(await within(sheet).findByText('Mléko a chleba')).toBeInTheDocument();
            expect(within(sheet).getByText('Marie Nová')).toBeInTheDocument();
            expect(within(sheet).getByText(price(200))).toBeInTheDocument();

            await user.keyboard('{Escape}');
            await waitFor(() => expect(currentSearchParams().has('detail')).toBe(false));
        });

        it('opens the detail of a clicked row in the URL', async () => {
            serveOptions();
            servePerformedTasks();
            serveDetails();
            const { user } = renderPage();

            await user.click(await findRecordRow('Karel Starý'));

            expect(currentSearchParams().get('detail')).toBe('101');
            expect(await screen.findByRole('dialog', { name: 'Doprovod' })).toBeInTheDocument();
        });

        it("is read-only for a caregiver who did not take part, editable for the record's caregiver", async () => {
            serveOptions();
            servePerformedTasks();
            serveDetails();
            const { user } = renderPage({ authStatus: caregiver({ employeeId: JANA.id }), route: '/performed-tasks?detail=101' });

            const otherSheet = await screen.findByRole('dialog', { name: 'Doprovod' });
            await within(otherSheet).findByText('Bez poznámky.');
            expect(within(otherSheet).queryByRole('button', { name: /Upravit/ })).not.toBeInTheDocument();

            await user.keyboard('{Escape}');
            await user.click(await findRecordRow('Marie Nová'));

            const ownSheet = await screen.findByRole('dialog', { name: 'Nákup' });
            expect(await within(ownSheet).findByRole('button', { name: /Upravit/ })).toBeInTheDocument();
        });

        it('closes and shows a toast when the record does not exist', async () => {
            serveOptions();
            servePerformedTasks();
            server.use(http.get(apiUrl('/performed-tasks/999'), serverError('Provedený úkon nebyl nalezen', 404)));

            renderPage({ route: '/performed-tasks?detail=999' });

            expect(await screen.findByText('Úkon nenalezen')).toBeInTheDocument();
            expect(screen.getByText('Provedený úkon nebyl nalezen')).toBeInTheDocument();
            await waitFor(() => expect(currentSearchParams().has('detail')).toBe(false));
        });
    });

    describe('receipts', () => {
        let downloadedFiles;
        const originalCreateObjectURL = URL.createObjectURL;
        const originalRevokeObjectURL = URL.revokeObjectURL;

        beforeEach(() => {
            downloadedFiles = [];
            URL.createObjectURL = vi.fn(() => 'blob:receipt');
            URL.revokeObjectURL = vi.fn();
            vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordDownload() {
                downloadedFiles.push(this.download);
            });
        });

        afterEach(() => {
            URL.createObjectURL = originalCreateObjectURL;
            URL.revokeObjectURL = originalRevokeObjectURL;
            vi.restoreAllMocks();
        });

        const pdf = () => new HttpResponse('%PDF-1.7', { headers: { 'Content-Type': 'application/pdf' } });

        async function openReceiptDialog() {
            serveOptions();
            servePerformedTasks();
            const rendered = renderPage();
            await findRecordRow('Marie Nová');
            await rendered.user.click(screen.getByRole('button', { name: /Stvrzenka/ }));
            return { ...rendered, dialog: screen.getByRole('dialog', { name: 'Stvrzenka za měsíc' }) };
        }

        it("downloads one client's receipt for the month", async () => {
            const receipts = serveAndRecord('get', '/performed-tasks/receipt', pdf);
            const { user, dialog } = await openReceiptDialog();

            await user.click(within(dialog).getByRole('button', { name: /Stáhnout PDF/ }));
            expect(within(dialog).getByText('Prosím vyberte klienta')).toBeInTheDocument();
            expect(receipts).toHaveLength(0);

            await user.click(within(dialog).getByRole('combobox', { name: /Klient/ }));
            await user.click(screen.getByRole('option', { name: /Marie Nová/ }));
            await user.click(within(dialog).getByRole('button', { name: /Stáhnout PDF/ }));

            await waitFor(() => expect(downloadedFiles).toEqual(['stvrzenka-marie-nova-2026-11.pdf']));
            expect(Object.fromEntries(receipts[0].searchParams)).toEqual({ clientId: '7', month: '11', year: '2026' });
        });

        it('downloads the receipts of the whole department', async () => {
            const receipts = serveAndRecord('get', '/performed-tasks/receipts', pdf);
            const { user, dialog } = await openReceiptDialog();

            await user.click(within(dialog).getByRole('radio', { name: 'Celé středisko' }));
            await user.click(within(dialog).getByRole('button', { name: /Stáhnout PDF/ }));

            await waitFor(() => expect(downloadedFiles).toEqual(['stvrzenky-plzen-2026-11.pdf']));
            expect(Object.fromEntries(receipts[0].searchParams)).toEqual({ departmentId: '2', month: '11', year: '2026' });
        });

        it('shows the server message when the receipt cannot be generated', async () => {
            serveAndRecord('get', '/performed-tasks/receipts', serverError('Ve středisku nejsou žádné úkony'));
            const { user, dialog } = await openReceiptDialog();

            await user.click(within(dialog).getByRole('radio', { name: 'Celé středisko' }));
            await user.click(within(dialog).getByRole('button', { name: /Stáhnout PDF/ }));

            expect(await screen.findByText('Chyba při generování stvrzenky')).toBeInTheDocument();
            expect(screen.getByText('Ve středisku nejsou žádné úkony')).toBeInTheDocument();
            expect(downloadedFiles).toEqual([]);
        });
    });
});

describe('Performed task form', () => {
    const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const field = (dialog, label) => within(dialog).getByLabelText(new RegExp(`^${escapeRegExp(label)}`));

    async function openCreateSheet({ authStatus = admin({ employeeId: JANA.id }), options } = {}) {
        serveOptions(options);
        servePerformedTasks();
        const rendered = renderPage({ authStatus });
        await findRecordRow('Marie Nová');
        await rendered.user.click(screen.getByRole('button', { name: /Zapsat úkon/ }));
        return { ...rendered, sheet: await screen.findByRole('dialog', { name: 'Zapsat úkon' }) };
    }

    async function choose(user, dialog, label, option) {
        await user.click(field(dialog, label));
        await user.click(screen.getByRole('option', { name: new RegExp(`^${option}`) }));
    }

    const offeredTaskNames = () => screen.getAllByRole('option').map((option) => option.textContent).sort((a, b) => a.localeCompare(b, 'cs'));

    const submit = (user, sheet) => user.click(within(sheet).getByRole('button', { name: 'Zapsat úkon' }));

    it('starts on today and now with the signed-in caregiver', async () => {
        const { sheet } = await openCreateSheet();

        expect(field(sheet, 'Datum')).toHaveTextContent('9. 11. 2026');
        expect(field(sheet, 'Čas')).toHaveValue('10:00');
        expect(field(sheet, 'Pečovatelé')).toHaveTextContent('Jana Testová');
    });

    it('requires a client, a task, an amount and a caregiver', async () => {
        const created = serveAndRecord('post', '/performed-tasks');
        const { user, sheet } = await openCreateSheet({ authStatus: coordinator({ employeeId: 99 }) });

        await submit(user, sheet);

        expect(within(sheet).getByText('Prosím vyberte klienta')).toBeInTheDocument();
        expect(within(sheet).getByText('Prosím vyberte úkon')).toBeInTheDocument();
        expect(within(sheet).getByText('Prosím zadejte množství')).toBeInTheDocument();
        expect(within(sheet).getByText('Prosím vyberte pečovatele')).toBeInTheDocument();
        expect(created).toHaveLength(0);
    });

    it('does not allow a date or time in the future', async () => {
        const { user, sheet } = await openCreateSheet();
        await choose(user, sheet, 'Klient', 'Marie Nová');
        await choose(user, sheet, 'Úkon', 'Nákup');
        await user.type(field(sheet, 'Počet'), '1');

        await user.click(field(sheet, 'Datum'));
        expect(screen.getByRole('button', { name: /^úterý, 10. listopadu 2026/ })).toBeDisabled();
        await user.keyboard('{Escape}');

        const time = field(sheet, 'Čas');
        await user.clear(time);
        await user.type(time, '23:50');
        await user.click(field(sheet, 'Poznámka'));
        await submit(user, sheet);

        expect(within(sheet).getByText('Úkon nemůže být v budoucnosti')).toBeInTheDocument();
    });

    it('needs a positive whole number for tasks counted in occurrences', async () => {
        const { user, sheet } = await openCreateSheet();
        await choose(user, sheet, 'Klient', 'Marie Nová');
        await choose(user, sheet, 'Úkon', 'Nákup');

        const amount = field(sheet, 'Počet');
        await user.type(amount, '0');
        await submit(user, sheet);
        expect(within(sheet).getByText('Zadejte kladné číslo')).toBeInTheDocument();

        // a decimal separator cannot even be typed for occurrences
        await user.clear(amount);
        await user.type(amount, '1,5');
        expect(amount).toHaveValue('15');
    });

    it('accepts decimals for kilometres', async () => {
        const { user, sheet } = await openCreateSheet();
        await choose(user, sheet, 'Klient', 'Karel Starý');
        await choose(user, sheet, 'Úkon', 'Doprava');

        const amount = field(sheet, 'Množství (km)');
        await user.type(amount, '12,5');

        expect(amount).toHaveValue('12,5');
        expect(within(sheet).getByText(price(calculatePrice(TRANSPORT, 12.5)))).toBeInTheDocument();
    });

    it("offers the tasks of the client's plan, or the whole active catalog on request", async () => {
        const { user, sheet } = await openCreateSheet();

        expect(field(sheet, 'Úkon')).toBeDisabled();
        await choose(user, sheet, 'Klient', 'Marie Nová');

        await user.click(field(sheet, 'Úkon'));
        expect(offeredTaskNames()).toEqual(['Doprovod', 'Nákup']);
        await user.keyboard('{Escape}');

        await user.click(within(sheet).getByRole('checkbox', { name: /Nabízet všechny úkony/ }));
        await user.click(field(sheet, 'Úkon'));
        expect(offeredTaskNames()).toEqual(['Doprava', 'Doprovod', 'Nákup']);
    });

    it('previews the price the same way calculatePrice does', async () => {
        const { user, sheet } = await openCreateSheet();
        await choose(user, sheet, 'Klient', 'Marie Nová');
        await choose(user, sheet, 'Úkon', 'Doprovod');

        expect(within(sheet).getByText('–')).toBeInTheDocument();
        await user.type(field(sheet, 'Délka (min)'), '50');

        expect(within(sheet).getByText(price(calculatePrice(ESCORT, 50)))).toBeInTheDocument();
    });

    it('sends the new record and adds it to the list', async () => {
        const created = serveAndRecord('post', '/performed-tasks', () => HttpResponse.json({
            id: 102, date: '2026-11-09T10:00:00', clientName: 'Marie Nová', taskName: 'Doprovod', unitCount: 45, unitType: 'HOUR',
            price: calculatePrice(ESCORT, 45), department: PLZEN, caregivers: [{ id: JANA.id, fullName: 'Jana Testová' }, { id: PETR.id, fullName: 'Petr Svoboda' }],
        }));
        const { user, sheet } = await openCreateSheet();

        await choose(user, sheet, 'Klient', 'Marie Nová');
        await choose(user, sheet, 'Úkon', 'Doprovod');
        await user.type(field(sheet, 'Délka (min)'), '45');
        await choose(user, sheet, 'Pečovatelé', 'Petr Svoboda');
        await user.keyboard('{Escape}');
        await user.type(field(sheet, 'Poznámka'), '  Procházka v parku  ');
        await submit(user, sheet);

        expect(await screen.findByText('Úkon úspěšně uložen')).toBeInTheDocument();
        expect(created[0].body).toEqual({
            clientId: MARIE.id,
            taskId: ESCORT.id,
            date: '2026-11-09T10:00:00',
            unitCount: 45,
            caregiverIds: [JANA.id, PETR.id],
            notes: 'Procházka v parku',
        });
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Zapsat úkon' })).not.toBeInTheDocument());
        expect(screen.getAllByRole('row', { name: /Marie Nová/ })).toHaveLength(2);
    });

    it('keeps the sheet open and shows the server message when saving fails', async () => {
        serveAndRecord('post', '/performed-tasks', serverError('Klientovi nelze zapsat úkon po datu ukončení služby', 400));
        const { user, sheet } = await openCreateSheet();

        await choose(user, sheet, 'Klient', 'Marie Nová');
        await choose(user, sheet, 'Úkon', 'Nákup');
        await user.type(field(sheet, 'Počet'), '1');
        await submit(user, sheet);

        expect(await screen.findByText('Klientovi nelze zapsat úkon po datu ukončení služby')).toBeInTheDocument();
        expect(screen.getByText('Chyba při ukládání úkonu')).toBeInTheDocument();
        expect(screen.getByRole('dialog', { name: 'Zapsat úkon' })).toBeInTheDocument();
    });

    it('keeps a caregiver among the caregivers of their own record', async () => {
        const { user, sheet } = await openCreateSheet({ authStatus: caregiver({ employeeId: JANA.id }) });

        await choose(user, sheet, 'Klient', 'Marie Nová');
        await choose(user, sheet, 'Úkon', 'Nákup');
        await user.type(field(sheet, 'Počet'), '1');
        await choose(user, sheet, 'Pečovatelé', 'Petr Svoboda');
        await user.click(screen.getByRole('option', { name: /^Jana Testová/ }));
        await user.keyboard('{Escape}');
        await submit(user, sheet);

        expect(within(sheet).getByText('Mezi pečovateli musíte být i vy')).toBeInTheDocument();
    });

    it('edits a record in the detail and sends the changes', async () => {
        serveOptions();
        servePerformedTasks();
        serveDetails();
        const updated = serveAndRecord('put', '/performed-tasks/:id', () => HttpResponse.json({ ...shoppingDetail, unitCount: 3 }));
        const { user } = renderPage({ route: '/performed-tasks?detail=100' });

        const sheet = await screen.findByRole('dialog', { name: 'Nákup' });
        await user.click(await within(sheet).findByRole('button', { name: /Upravit/ }));
        const editSheet = screen.getByRole('dialog', { name: 'Úprava záznamu' });
        const amount = await within(editSheet).findByLabelText(/^Počet/);
        expect(amount).toHaveValue('2');
        await user.clear(amount);
        await user.type(amount, '3');
        expect(within(editSheet).getByText(price(300))).toBeInTheDocument();
        await user.click(within(editSheet).getByRole('button', { name: 'Uložit změny' }));

        expect(await screen.findByText('Úkon úspěšně aktualizován')).toBeInTheDocument();
        expect(updated[0].path).toMatch(/\/performed-tasks\/100$/);
        expect(updated[0].body).toEqual({
            clientId: MARIE.id,
            taskId: SHOPPING.id,
            date: '2026-11-03T09:30:00',
            unitCount: 3,
            caregiverIds: [JANA.id],
            notes: 'Mléko a chleba',
        });
        expect(await screen.findByRole('dialog', { name: 'Nákup' })).toHaveTextContent(price(300));
    });
});
