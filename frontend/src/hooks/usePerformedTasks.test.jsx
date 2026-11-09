import { act, renderHook } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePerformedTasks } from './usePerformedTasks';
import { toast } from '@/components/ui/sonner';
import { serveAndRecord, serverError } from '@/test/hooks';


beforeEach(() => {
    vi.spyOn(toast, 'success').mockImplementation(() => {});
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

const performedTasks = [
    { id: 1, date: '2026-03-02', unitCount: 1 },
    { id: 2, date: '2026-03-20', unitCount: 2 },
];

async function renderWithLoadedList() {
    serveAndRecord('get', '/performed-tasks', () => HttpResponse.json(performedTasks));
    const hook = renderHook(usePerformedTasks);
    await act(() => hook.result.current.fetchPerformedTasks());
    return hook;
}

describe('usePerformedTasks', () => {
    it('sends the filters with a 1-based month and returns the newest first', async () => {
        const requests = serveAndRecord('get', '/performed-tasks', () => HttpResponse.json(performedTasks));
        const { result } = renderHook(usePerformedTasks);

        await act(() => result.current.fetchPerformedTasks({
            clientId: 7,
            organizationId: 1,
            departmentIds: [2, 3],
            caregiverIds: [10],
            month: 0,
            year: 2026,
        }));

        expect(requests[0].searchParams.toString())
            .toBe('clientId=7&organizationId=1&departmentIds=2&departmentIds=3&caregiverIds=10&month=1&year=2026');
        expect(result.current.performedTasks.map((task) => task.id)).toEqual([2, 1]);
        expect(result.current.loading).toBe(false);
    });

    it('shows an error toast when the list fails to load', async () => {
        serveAndRecord('get', '/performed-tasks', serverError('Databáze neodpovídá'));
        const { result } = renderHook(usePerformedTasks);

        await act(() => result.current.fetchPerformedTasks());

        expect(toast.error).toHaveBeenCalledWith('Chyba při načítání provedených úkonů', { description: 'Databáze neodpovídá' });
        expect(result.current.loading).toBe(false);
    });

    it('creates a performed task and puts it in date order', async () => {
        const { result } = await renderWithLoadedList();
        const created = serveAndRecord('post', '/performed-tasks', () => HttpResponse.json({ id: 3, date: '2026-03-10' }));

        await act(() => result.current.createPerformedTask({ date: '2026-03-10', taskId: 4 }));

        expect(created[0].body).toEqual({ date: '2026-03-10', taskId: 4 });
        expect(result.current.performedTasks.map((task) => task.id)).toEqual([2, 3, 1]);
        expect(toast.success).toHaveBeenCalledWith('Úkon úspěšně uložen');
    });

    it('replaces the updated task with its list summary', async () => {
        const { result } = await renderWithLoadedList();
        serveAndRecord('put', '/performed-tasks/:id', () => HttpResponse.json({
            id: 1,
            date: '2026-03-25',
            unitCount: 90,
            client: { fullName: 'Marie Nová' },
            task: { name: 'Úklid', unitType: 'HOUR', unitPrice: 200 },
            department: { id: 2 },
            caregivers: [{ id: 10 }],
        }));

        await act(() => result.current.updatePerformedTask(1, { unitCount: 90 }));

        expect(result.current.performedTasks[0]).toEqual({
            id: 1,
            date: '2026-03-25',
            unitCount: 90,
            clientName: 'Marie Nová',
            taskName: 'Úklid',
            unitType: 'HOUR',
            price: 300,
            department: { id: 2 },
            caregivers: [{ id: 10 }],
        });
        expect(result.current.performedTasks.map((task) => task.id)).toEqual([1, 2]);
    });

    it('deletes a performed task and removes it from the list', async () => {
        const { result } = await renderWithLoadedList();
        const deleted = serveAndRecord('delete', '/performed-tasks/:id', () => new HttpResponse(null, { status: 204 }));

        await act(() => result.current.deletePerformedTask(2));

        expect(deleted[0].path).toBe('/api/performed-tasks/2');
        expect(result.current.performedTasks.map((task) => task.id)).toEqual([1]);
        expect(toast.success).toHaveBeenCalledWith('Úkon úspěšně odstraněn');
    });

    it('keeps the list and rethrows when a delete fails', async () => {
        const { result } = await renderWithLoadedList();
        serveAndRecord('delete', '/performed-tasks/:id', serverError('Úkon je uzavřený', 409));

        await expect(result.current.deletePerformedTask(2)).rejects.toThrow('Úkon je uzavřený');

        expect(toast.error).toHaveBeenCalledWith('Chyba při odstraňování úkonu', { description: 'Úkon je uzavřený' });
        expect(result.current.performedTasks).toHaveLength(2);
    });

    it.each([
        ['fetchReceipt', '/performed-tasks/receipt', 'clientId=7&month=3&year=2026'],
        ['fetchDepartmentReceipts', '/performed-tasks/receipts', 'departmentId=7&month=3&year=2026'],
    ])('%s downloads the PDF for a 1-based month', async (fetchPdf, path, query) => {
        const requests = serveAndRecord('get', path, () => new HttpResponse('%PDF-1.7', { headers: { 'Content-Type': 'application/pdf' } }));
        const { result } = renderHook(usePerformedTasks);

        const pdf = await result.current[fetchPdf](7, 2, 2026);

        expect(requests[0].searchParams.toString()).toBe(query);
        expect(await pdf.text()).toBe('%PDF-1.7');
    });

    it('shows the server message when a receipt cannot be generated', async () => {
        serveAndRecord('get', '/performed-tasks/receipt', serverError('Klient nemá v měsíci žádné úkony', 404));
        const { result } = renderHook(usePerformedTasks);

        await expect(result.current.fetchReceipt(7, 2, 2026)).rejects.toThrow('Klient nemá v měsíci žádné úkony');

        expect(toast.error).toHaveBeenCalledWith('Chyba při generování stvrzenky', { description: 'Klient nemá v měsíci žádné úkony' });
    });
});
