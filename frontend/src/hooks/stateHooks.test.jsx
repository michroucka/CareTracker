import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRecordForm } from './useRecordForm';
import { useIsMobile, useMediaQuery } from './useMediaQuery';
import { useTokenValidation } from './useTokenValidation';
import { useEmployeeOverview } from './useEmployeeOverview';
import { apiUrl, server } from '@/test/server';
import { forwardAbortSignalsToFetch } from '@/test/hooks';

forwardAbortSignalsToFetch();

afterEach(() => vi.restoreAllMocks());

describe('useRecordForm', () => {
    const requireName = (values) => (values.name ? {} : { name: 'Vyplňte jméno' });

    it('does not save invalid values and shows the errors', async () => {
        const save = vi.fn();
        const { result } = renderHook(() => useRecordForm({ name: '' }));

        let saved;
        await act(async () => {
            saved = await result.current.submit(requireName, save);
        });

        expect(saved).toBe(false);
        expect(save).not.toHaveBeenCalled();
        expect(result.current.errors).toEqual({ name: 'Vyplňte jméno' });
        expect(result.current.submitCount).toBe(1);
    });

    it('clears the error of a field once it changes', async () => {
        const { result } = renderHook(() => useRecordForm({ name: '', city: '' }));
        await act(() => result.current.submit(() => ({ name: 'Vyplňte jméno', city: 'Vyplňte město' }), vi.fn()));

        act(() => result.current.setField('name', 'Marie'));

        expect(result.current.values).toEqual({ name: 'Marie', city: '' });
        expect(result.current.errors).toEqual({ name: undefined, city: 'Vyplňte město' });
    });

    it('saves valid values and reports success', async () => {
        const save = vi.fn().mockResolvedValue({ id: 1 });
        const { result } = renderHook(() => useRecordForm({ name: 'Marie' }));

        let saved;
        await act(async () => {
            saved = await result.current.submit(requireName, save);
        });

        expect(saved).toBe(true);
        expect(save).toHaveBeenCalledWith({ name: 'Marie' });
        expect(result.current.isSubmitting).toBe(false);
    });

    it('is submitting while the save runs', async () => {
        let finishSave;
        const save = () => new Promise((resolve) => { finishSave = resolve; });
        const { result } = renderHook(() => useRecordForm({ name: 'Marie' }));

        let submitting;
        act(() => {
            submitting = result.current.submit(requireName, save);
        });
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            finishSave();
            await submitting;
        });
        expect(result.current.isSubmitting).toBe(false);
    });

    it('keeps the form open when the save fails', async () => {
        const { result } = renderHook(() => useRecordForm({ name: 'Marie' }));

        let saved;
        await act(async () => {
            saved = await result.current.submit(requireName, () => Promise.reject(new Error('Server error')));
        });

        expect(saved).toBe(false);
        expect(result.current.values).toEqual({ name: 'Marie' });
        expect(result.current.isSubmitting).toBe(false);
    });

    it('resets values and errors', async () => {
        const { result } = renderHook(() => useRecordForm({ name: '' }));
        await act(() => result.current.submit(requireName, vi.fn()));

        act(() => result.current.reset({ name: 'Karel' }));

        expect(result.current.values).toEqual({ name: 'Karel' });
        expect(result.current.errors).toEqual({});
    });
});

function mockMatchMedia(initiallyMatches) {
    const listeners = new Set();
    const media = {
        matches: initiallyMatches,
        addEventListener: (_, listener) => listeners.add(listener),
        removeEventListener: (_, listener) => listeners.delete(listener),
    };
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue(media);
    const change = (matches) => {
        media.matches = matches;
        listeners.forEach((listener) => listener());
    };
    return { matchMedia, change, listeners };
}

describe('useMediaQuery', () => {
    it('reports whether the query matches and follows its changes', () => {
        const { matchMedia, change } = mockMatchMedia(true);

        const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'));

        expect(matchMedia).toHaveBeenCalledWith('(max-width: 640px)');
        expect(result.current).toBe(true);

        act(() => change(false));
        expect(result.current).toBe(false);
    });

    it('stops listening after unmount', () => {
        const { listeners } = mockMatchMedia(false);

        const { unmount } = renderHook(() => useMediaQuery('(max-width: 640px)'));
        expect(listeners.size).toBe(1);

        unmount();
        expect(listeners.size).toBe(0);
    });

    it('asks for the mobile breakpoint', () => {
        const { matchMedia } = mockMatchMedia(false);

        renderHook(useIsMobile);

        expect(matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });
});

describe('useTokenValidation', () => {
    function serveValidation(respond) {
        const requestedTokens = [];
        server.use(http.get(apiUrl('/activation/validate'), ({ request }) => {
            requestedTokens.push(new URL(request.url).searchParams.get('token'));
            return respond();
        }));
        return requestedTokens;
    }

    it('accepts a token the server confirms', async () => {
        const requestedTokens = serveValidation(() => HttpResponse.json({ success: true }));

        const { result } = renderHook(() => useTokenValidation('/activation/validate', 'a+b/c'));

        expect(result.current.isValidating).toBe(true);
        await waitFor(() => expect(result.current.isValidating).toBe(false));
        expect(result.current.isValid).toBe(true);
        expect(requestedTokens).toEqual(['a+b/c']);
    });

    it.each([
        ['the server rejects', () => HttpResponse.json({ success: false })],
        ['the server answers with an error status', () => HttpResponse.json({ success: true }, { status: 400 })],
        ['the request fails', () => HttpResponse.error()],
    ])('refuses a token when %s', async (_, respond) => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        serveValidation(respond);

        const { result } = renderHook(() => useTokenValidation('/activation/validate', 'token'));

        await waitFor(() => expect(result.current.isValidating).toBe(false));
        expect(result.current.isValid).toBe(false);
    });

    it('refuses a missing token without asking the server', () => {
        const { result } = renderHook(() => useTokenValidation('/activation/validate', null));

        expect(result.current).toEqual({ isValidating: false, isValid: false });
    });
});

describe('useEmployeeOverview', () => {
    const today = new Date();

    function serveOverview({ clientsStatus = 200 } = {}) {
        const requests = [];
        server.use(
            http.get(apiUrl('/clients'), ({ request }) => {
                requests.push(request.url);
                return HttpResponse.json(clientsStatus === 200 ? [{ id: 1 }] : { message: 'Chyba' }, { status: clientsStatus });
            }),
            http.get(apiUrl('/performed-tasks'), ({ request }) => {
                requests.push(request.url);
                return HttpResponse.json([{ id: 5 }]);
            }),
        );
        return requests;
    }

    it("loads the employee's active clients and performed tasks of the current month", async () => {
        const requests = serveOverview();

        const { result } = renderHook(() => useEmployeeOverview(10, 3));

        expect(result.current).toBeNull();
        await waitFor(() => expect(result.current).toEqual({ clients: [{ id: 1 }], performedTasks: [{ id: 5 }] }));

        const [clientsUrl, tasksUrl] = requests.map((url) => new URL(url).searchParams);
        expect(Object.fromEntries(clientsUrl)).toEqual({ status: 'true', caregiverIds: '10', organizationId: '3' });
        expect(Object.fromEntries(tasksUrl)).toEqual({
            caregiverIds: '10',
            month: String(today.getMonth() + 1),
            year: String(today.getFullYear()),
            organizationId: '3',
        });
    });

    it('leaves the organization out when there is none', async () => {
        const requests = serveOverview();

        renderHook(() => useEmployeeOverview(10));

        await waitFor(() => expect(requests).toHaveLength(2));
        requests.forEach((url) => expect(new URL(url).searchParams.has('organizationId')).toBe(false));
    });

    it('marks the overview as failed when a request fails', async () => {
        serveOverview({ clientsStatus: 500 });

        const { result } = renderHook(() => useEmployeeOverview(10));

        await waitFor(() => expect(result.current).toEqual({ clients: [], performedTasks: [], failed: true }));
    });

    it('loads nothing without an employee', () => {
        const { result } = renderHook(() => useEmployeeOverview(null));

        expect(result.current).toBeNull();
    });
});
