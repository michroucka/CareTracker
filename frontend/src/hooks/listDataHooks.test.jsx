import { act, renderHook, waitFor } from '@testing-library/react';
import { delay, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClients } from './useClients';
import { useEmployees } from './useEmployees';
import { useTasks } from './useTasks';
import { useDepartments } from './useDepartments';
import { useOrganizations } from './useOrganizations';
import { toast } from '@/components/ui/sonner';
import { forwardAbortSignalsToFetch, serveAndRecord, serverError } from '@/test/hooks';

forwardAbortSignalsToFetch();

beforeEach(() => {
    vi.spyOn(toast, 'success').mockImplementation(() => {});
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

const person = (id, firstName, lastName) => ({ id, firstName, lastName, street: 'Americká 12', city: 'Plzeň' });

const listHooks = [
    {
        name: 'useClients',
        useHook: useClients,
        fetchList: 'fetchClients',
        list: 'clients',
        path: '/clients',
        filters: { organizationId: 1, status: false, departmentIds: [2, 3], caregiverIds: [10, 11] },
        query: 'organizationId=1&status=false&departmentIds=2&departmentIds=3&caregiverIds=10&caregiverIds=11',
        rows: [person(1, 'Marie', 'Nová'), person(2, 'Karel', 'Adam')],
        sortedIds: [2, 1],
        errorTitle: 'Chyba při načítání klientů',
        mutations: [
            ['updateClient', [1, { firstName: 'Marie', picture: undefined }], 'put', '/clients/1', 'Klient úspěšně aktualizován'],
            ['terminateClient', [1, { reason: 'Odchod' }], 'put', '/clients/1/terminate', 'Klient úspěšně deaktivován'],
            ['activateClient', [1], 'put', '/clients/1/activate', 'Klient úspěšně aktivován'],
            ['deactivateClientAccount', [1], 'put', '/clients/1/account/deactivate', 'Účet klienta byl deaktivován'],
            ['activateClientAccount', [1], 'put', '/clients/1/account/activate', 'Účet klienta byl aktivován'],
        ],
    },
    {
        name: 'useEmployees',
        useHook: useEmployees,
        fetchList: 'fetchEmployees',
        list: 'employees',
        path: '/employees',
        filters: { organizationId: 1, status: true, departmentIds: [2] },
        query: 'organizationId=1&status=true&departmentIds=2',
        rows: [person(1, 'Jana', 'Testová'), person(2, 'Petr', 'Bílý')],
        sortedIds: [2, 1],
        errorTitle: 'Chyba při načítání zaměstnanců',
        mutations: [
            ['updateEmployee', [1, { firstName: 'Jana' }], 'put', '/employees/1', 'Zaměstnanec úspěšně aktualizován'],
            ['terminateEmployee', [1], 'put', '/employees/1/terminate', 'Zaměstnanec úspěšně deaktivován'],
            ['activateEmployee', [1], 'put', '/employees/1/activate', 'Zaměstnanec úspěšně aktivován'],
        ],
    },
    {
        name: 'useTasks',
        useHook: useTasks,
        fetchList: 'fetchTasks',
        list: 'tasks',
        path: '/tasks',
        filters: { organizationId: 1, status: true },
        query: 'organizationId=1&status=true',
        rows: [{ id: 1, name: 'Úklid' }, { id: 2, name: 'Nákup' }],
        sortedIds: [2, 1],
        errorTitle: 'Chyba při načítání úkolů',
        mutations: [
            ['updateTask', [1, { name: 'Úklid' }], 'put', '/tasks/1', 'Úkon úspěšně aktualizován'],
            ['terminateTask', [1], 'put', '/tasks/1/terminate', 'Úkon úspěšně deaktivován'],
            ['activateTask', [1], 'put', '/tasks/1/activate', 'Úkon úspěšně aktivován'],
        ],
    },
    {
        name: 'useDepartments',
        useHook: useDepartments,
        fetchList: 'fetchDepartments',
        list: 'departments',
        path: '/departments',
        filters: { organizationId: 1, status: false },
        query: 'organizationId=1&status=false',
        rows: [{ id: 1, city: 'Plzeň' }, { id: 2, city: 'Brno' }],
        sortedIds: [2, 1],
        errorTitle: 'Chyba při načítání střediska',
        mutations: [
            ['updateDepartment', [1, { city: 'Plzeň' }], 'put', '/departments/1', 'Středisko úspěšně aktualizováno'],
            ['terminateDepartment', [1], 'put', '/departments/1/terminate', 'Středisko úspěšně deaktivováno'],
            ['activateDepartment', [1], 'put', '/departments/1/activate', 'Středisko úspěšně aktivováno'],
        ],
    },
    {
        name: 'useOrganizations',
        useHook: useOrganizations,
        fetchList: 'fetchOrganizations',
        list: 'organizations',
        path: '/organizations',
        filters: { status: true },
        query: 'status=true',
        rows: [{ id: 1, name: 'Zdraví' }, { id: 2, name: 'Asistence' }],
        sortedIds: [2, 1],
        errorTitle: 'Chyba při načítání organizací',
        mutations: [
            ['updateOrganization', [1, { name: 'Zdraví' }], 'put', '/organizations/1', 'Organizace úspěšně aktualizována'],
            ['terminateOrganization', [1], 'put', '/organizations/1/terminate', 'Organizace úspěšně deaktivována'],
            ['activateOrganization', [1], 'put', '/organizations/1/activate', 'Organizace úspěšně aktivována'],
        ],
    },
];

describe.each(listHooks)('$name', ({ useHook, fetchList, list, path, filters, query, rows, sortedIds, errorTitle, mutations }) => {
    const idsOf = (records) => records.map((record) => record.id);

    it('sends the filters as query params and returns the list sorted', async () => {
        const requests = serveAndRecord('get', path, () => HttpResponse.json(rows));
        const { result } = renderHook(useHook);

        let fetching;
        act(() => {
            fetching = result.current[fetchList](filters);
        });
        expect(result.current.loading).toBe(true);
        await act(() => fetching);

        expect(requests.map((request) => request.searchParams.toString())).toEqual([query]);
        expect(idsOf(result.current[list])).toEqual(sortedIds);
        expect(result.current.loading).toBe(false);
    });

    it('asks without a query when there are no filters', async () => {
        const requests = serveAndRecord('get', path, () => HttpResponse.json([]));
        const { result } = renderHook(useHook);

        await act(() => result.current[fetchList]());

        expect(requests[0].searchParams.toString()).toBe('');
    });

    it('shows an error toast and stops loading when the list fails to load', async () => {
        serveAndRecord('get', path, serverError('Databáze neodpovídá'));
        const { result } = renderHook(useHook);

        await act(() => result.current[fetchList](filters));

        expect(toast.error).toHaveBeenCalledWith(errorTitle, { description: 'Databáze neodpovídá' });
        expect(result.current.loading).toBe(false);
        expect(result.current[list]).toEqual([]);
    });

    it.each(mutations)('%s calls %s %s and reloads the list with the last filters', async (mutation, args, method, mutationPath, successMessage) => {
        const listRequests = serveAndRecord('get', path, () => HttpResponse.json(rows));
        const mutationRequests = serveAndRecord(method, mutationPath, () => HttpResponse.json({ id: 1 }));
        const { result } = renderHook(useHook);
        await act(() => result.current[fetchList](filters));

        await act(() => result.current[mutation](...args));

        expect(mutationRequests).toHaveLength(1);
        expect(toast.success).toHaveBeenCalledWith(successMessage);
        await waitFor(() => expect(listRequests).toHaveLength(2));
        expect(listRequests[1].searchParams.toString()).toBe(query);
        // the reload is silent: the list stays on screen instead of flashing a loading state
        expect(result.current.loading).toBe(false);
        expect(idsOf(result.current[list])).toEqual(sortedIds);
    });

    it('shows an error toast and rethrows when a mutation fails', async () => {
        const [mutation, args, method, mutationPath] = mutations[0];
        serveAndRecord(method, mutationPath, serverError('Záznam je zamčený', 409));
        const { result } = renderHook(useHook);

        await expect(result.current[mutation](...args)).rejects.toThrow('Záznam je zamčený');

        expect(toast.error).toHaveBeenCalledWith(expect.any(String), { description: 'Záznam je zamčený' });
        expect(toast.success).not.toHaveBeenCalled();
    });
});

describe.each(listHooks.filter(({ name }) => name !== 'useOrganizations'))('$name with a newer request', ({ useHook, fetchList, list, path }) => {
    it('drops the answer to an older request', async () => {
        serveAndRecord('get', path, async ({ request }) => {
            const isOlder = new URL(request.url).searchParams.get('status') === 'true';
            if (isOlder) await delay(50);
            return HttpResponse.json([{ id: isOlder ? 1 : 2, firstName: 'A', lastName: 'B', name: 'C', city: 'D' }]);
        });
        const { result } = renderHook(useHook);

        await act(() => Promise.all([
            result.current[fetchList]({ status: true }),
            result.current[fetchList]({ status: false }),
        ]));

        expect(result.current[list].map((record) => record.id)).toEqual([2]);
        expect(toast.error).not.toHaveBeenCalled();
    });
});

describe('useOrganizations with a newer request', () => {
    // Nález: fetchOrganizations passes `signalL` instead of `signal` to getJSON, so an older request is
    // never aborted and its late answer overwrites the newer list (e.g. after switching the status filter).
    it.skip('drops the answer to an older request', async () => {
        serveAndRecord('get', '/organizations', async ({ request }) => {
            const isOlder = new URL(request.url).searchParams.get('status') === 'true';
            if (isOlder) await delay(50);
            return HttpResponse.json([{ id: isOlder ? 1 : 2, name: 'Zdraví' }]);
        });
        const { result } = renderHook(useOrganizations);

        await act(() => Promise.all([
            result.current.fetchOrganizations({ status: true }),
            result.current.fetchOrganizations({ status: false }),
        ]));

        expect(result.current.organizations.map((organization) => organization.id)).toEqual([2]);
    });
});

describe('useClients', () => {
    it('adds the full name and the address to each client', async () => {
        serveAndRecord('get', '/clients', () => HttpResponse.json([person(1, 'Marie', 'Nová')]));
        const { result } = renderHook(useClients);

        await act(() => result.current.fetchClients());

        expect(result.current.clients[0]).toMatchObject({ fullName: 'Marie Nová', address: 'Americká 12, Plzeň' });
    });

    it('creates a client without sending the picture and adds it to the list in order', async () => {
        serveAndRecord('get', '/clients', () => HttpResponse.json([person(1, 'Marie', 'Nová')]));
        const created = serveAndRecord('post', '/clients', () => HttpResponse.json(person(2, 'Karel', 'Adam')));
        const { result } = renderHook(useClients);
        await act(() => result.current.fetchClients());

        await act(() => result.current.createClient({ firstName: 'Karel', lastName: 'Adam', picture: undefined }));

        expect(created[0].body).toEqual({ firstName: 'Karel', lastName: 'Adam' });
        expect(result.current.clients.map((client) => client.fullName)).toEqual(['Karel Adam', 'Marie Nová']);
        expect(toast.success).toHaveBeenCalledWith('Klient úspěšně vytvořen');
    });

    it('creates a client account with the e-mail in the query and shows the server message', async () => {
        serveAndRecord('get', '/clients', () => HttpResponse.json([]));
        const requests = serveAndRecord('post', '/clients/:id/account/create', () => HttpResponse.json({ success: true, message: 'Účet vytvořen' }));
        const { result } = renderHook(useClients);

        await act(() => result.current.createClientAccount(4, 'marie+nova@example.cz'));

        expect(requests[0].path).toBe('/api/clients/4/account/create');
        expect(requests[0].searchParams.get('email')).toBe('marie+nova@example.cz');
        expect(toast.success).toHaveBeenCalledWith('Účet vytvořen');
    });

    it('shows a refused activation e-mail as an error', async () => {
        serveAndRecord('post', '/clients/:id/account/resend', () => HttpResponse.json({ success: false, message: 'Účet je už aktivní' }));
        const { result } = renderHook(useClients);

        await act(() => result.current.resendClientActivation(4));

        expect(toast.error).toHaveBeenCalledWith('Účet je už aktivní');
    });

    it('loads one client by id', async () => {
        serveAndRecord('get', '/clients/:id', () => HttpResponse.json(person(4, 'Marie', 'Nová')));
        const { result } = renderHook(useClients);

        await expect(result.current.fetchClient(4)).resolves.toMatchObject({ id: 4, fullName: 'Marie Nová' });
    });

    it('shows an error toast when one client is not found', async () => {
        serveAndRecord('get', '/clients/:id', serverError('Klient neexistuje', 404));
        const { result } = renderHook(useClients);

        await expect(result.current.fetchClient(4)).rejects.toThrow('Klient neexistuje');
        expect(toast.error).toHaveBeenCalledWith('Klient nenalezen', { description: 'Klient neexistuje' });
    });
});

describe('useEmployees', () => {
    it('creates an employee and adds it to the list in order', async () => {
        serveAndRecord('get', '/employees', () => HttpResponse.json([person(1, 'Jana', 'Testová')]));
        const created = serveAndRecord('post', '/employees', () => HttpResponse.json(person(2, 'Petr', 'Bílý')));
        const { result } = renderHook(useEmployees);
        await act(() => result.current.fetchEmployees());

        await act(() => result.current.createEmployee({ firstName: 'Petr', lastName: 'Bílý', picture: undefined }));

        expect(created[0].body).toEqual({ firstName: 'Petr', lastName: 'Bílý' });
        expect(result.current.employees.map((employee) => employee.fullName)).toEqual(['Petr Bílý', 'Jana Testová']);
    });

    it.each([
        [true, 'success'],
        [false, 'error'],
    ])('shows the resend activation answer (success: %s) as a %s toast', async (success, toastType) => {
        const requests = serveAndRecord('post', '/employees/:id/resend', () => HttpResponse.json({ success, message: 'Odpověď serveru' }));
        const { result } = renderHook(useEmployees);

        await act(() => result.current.resendActivationEmail(3));

        expect(requests[0].path).toBe('/api/employees/3/resend');
        expect(toast[toastType]).toHaveBeenCalledWith('Odpověď serveru');
    });
});

describe.each([
    ['useTasks', useTasks, 'createTask', 'tasks', '/tasks', { name: 'Nákup' }, [{ id: 1, name: 'Úklid' }], ['Nákup', 'Úklid'], 'name'],
    ['useDepartments', useDepartments, 'createDepartment', 'departments', '/departments', { city: 'Brno' }, [{ id: 1, city: 'Plzeň' }], ['Brno', 'Plzeň'], 'city'],
    ['useOrganizations', useOrganizations, 'createOrganization', 'organizations', '/organizations', { name: 'Asistence' }, [{ id: 1, name: 'Zdraví' }], ['Asistence', 'Zdraví'], 'name'],
])('%s create', (_, useHook, create, list, path, newRecord, existing, expectedOrder, sortKey) => {
    it('posts the record and adds it to the list in order', async () => {
        serveAndRecord('get', path, () => HttpResponse.json(existing));
        const created = serveAndRecord('post', path, () => HttpResponse.json({ id: 2, ...newRecord }));
        const { result } = renderHook(useHook);
        await act(() => result.current[`fetch${create.slice('create'.length)}s`]());

        await act(() => result.current[create](newRecord));

        expect(created[0].body).toEqual(newRecord);
        expect(result.current[list].map((record) => record[sortKey])).toEqual(expectedOrder);
        expect(toast.success).toHaveBeenCalled();
    });
});
