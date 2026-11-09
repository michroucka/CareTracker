import { act, renderHook } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIndividualPlan } from './useIndividualPlan';
import { toast } from '@/components/ui/sonner';
import { serveAndRecord, serverError } from '@/test/hooks';

beforeEach(() => {
    vi.spyOn(toast, 'success').mockImplementation(() => {});
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

const content = { versionNumber: 2, likes: 'Procházky' };
const plan = { id: 1, currentContent: content, dailyRecords: [] };
const history = [{ versionNumber: 2 }, { versionNumber: 1 }];

describe('useIndividualPlan', () => {
    it('loads the current plan and its content', async () => {
        serveAndRecord('get', '/clients/:id/individual-plan', () => HttpResponse.json(plan));
        const { result } = renderHook(useIndividualPlan);

        await act(() => result.current.fetchIndividualPlan(7));

        expect(result.current.individualPlan).toEqual(plan);
        expect(result.current.currentContent).toEqual(content);
        expect(result.current.loading).toBe(false);
    });

    it('treats a client without a plan (empty 404) as no plan, without a toast', async () => {
        serveAndRecord('get', '/clients/:id/individual-plan', () => new HttpResponse(null, { status: 404 }));
        const { result } = renderHook(useIndividualPlan);

        let loaded;
        await act(async () => {
            loaded = await result.current.fetchIndividualPlan(7);
        });

        expect(loaded).toBeNull();
        expect(result.current.individualPlan).toBeNull();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('shows an error toast and rethrows other errors', async () => {
        serveAndRecord('get', '/clients/:id/individual-plan', serverError('Nemáte přístup ke klientovi', 403));
        const { result } = renderHook(useIndividualPlan);

        await expect(result.current.fetchIndividualPlan(7)).rejects.toThrow('Nemáte přístup ke klientovi');

        expect(toast.error).toHaveBeenCalledWith('Chyba při načítání individuálního plánu', { description: 'Nemáte přístup ke klientovi' });
    });

    it('loads the version history and treats a missing history as empty', async () => {
        serveAndRecord('get', '/clients/:id/individual-plan/history', () => HttpResponse.json(history));
        const { result } = renderHook(useIndividualPlan);

        await act(() => result.current.fetchVersions(7));
        expect(result.current.versions).toEqual(history);

        serveAndRecord('get', '/clients/:id/individual-plan/history', serverError('Individuální plán klienta nebyl nalezen', 404));
        await act(() => result.current.fetchVersions(7));
        expect(result.current.versions).toEqual([]);
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('loads a specific version as the shown content', async () => {
        const requests = serveAndRecord('get', '/clients/:id/individual-plan/:version', () => HttpResponse.json({ versionNumber: 1 }));
        const { result } = renderHook(useIndividualPlan);

        await act(() => result.current.fetchIndividualPlanByVersion(7, 1));

        expect(requests[0].path).toBe('/api/clients/7/individual-plan/1');
        expect(result.current.currentContent).toEqual({ versionNumber: 1 });
    });

    it.each([
        ['createIndividualPlan', 'post', 'Individuální plán byl úspěšně vytvořen'],
        ['updateIndividualPlan', 'put', 'Nová verze individuálního plánu byla úspěšně vytvořena'],
    ])('%s saves the content and reloads the history', async (save, method, successMessage) => {
        const saved = serveAndRecord(method, '/clients/:id/individual-plan', () => HttpResponse.json(plan));
        const historyRequests = serveAndRecord('get', '/clients/:id/individual-plan/history', () => HttpResponse.json(history));
        const { result } = renderHook(useIndividualPlan);

        await act(() => result.current[save](7, { likes: 'Procházky' }));

        expect(saved[0].body).toEqual({ likes: 'Procházky' });
        expect(historyRequests).toHaveLength(1);
        expect(result.current.versions).toEqual(history);
        expect(result.current.currentContent).toEqual(content);
        expect(toast.success).toHaveBeenCalledWith(successMessage);
    });

    it('shows an error toast and rethrows when saving fails', async () => {
        serveAndRecord('put', '/clients/:id/individual-plan', serverError('Neplatné datum'));
        const { result } = renderHook(useIndividualPlan);

        await expect(result.current.updateIndividualPlan(7, {})).rejects.toThrow('Neplatné datum');

        expect(toast.error).toHaveBeenCalledWith('Chyba při aktualizaci individuálního plánu', { description: 'Neplatné datum' });
    });

    it('adds a daily record and shows the updated plan', async () => {
        const updatedPlan = { ...plan, dailyRecords: [{ id: 5, content: 'Nákup' }] };
        const added = serveAndRecord('post', '/clients/:id/individual-plan/daily-records', () => HttpResponse.json(updatedPlan));
        const { result } = renderHook(useIndividualPlan);

        await act(() => result.current.addDailyRecord(7, { date: '2026-11-02', content: 'Nákup' }));

        expect(added[0].body).toEqual({ date: '2026-11-02', content: 'Nákup' });
        expect(result.current.individualPlan).toEqual(updatedPlan);
    });

    it('removes a daily record and shows the plan the server returns', async () => {
        const removed = serveAndRecord('delete', '/clients/:id/individual-plan/daily-records/:recordId', () => HttpResponse.json(plan));
        const { result } = renderHook(useIndividualPlan);

        await act(() => result.current.removeDailyRecord(7, 5));

        expect(removed[0].path).toBe('/api/clients/7/individual-plan/daily-records/5');
        expect(result.current.individualPlan).toEqual(plan);
        expect(toast.success).toHaveBeenCalledWith('Denní záznam byl úspěšně odstraněn');
    });

    it('resets everything', async () => {
        serveAndRecord('get', '/clients/:id/individual-plan', () => HttpResponse.json(plan));
        const { result } = renderHook(useIndividualPlan);
        await act(() => result.current.fetchIndividualPlan(7));

        act(() => result.current.reset());

        expect(result.current).toMatchObject({ versions: [], individualPlan: null, currentContent: null, loading: false });
    });
});
