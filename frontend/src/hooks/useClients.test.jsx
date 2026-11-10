import { act, renderHook } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { useClients } from './useClients';
import { toast } from '@/components/ui/sonner';
import { serveAndRecord } from '@/test/hooks';

describe('useClients on a page without the list', () => {
    it('does not load the whole list after a change, as the client detail page shows no list', async () => {
        vi.spyOn(toast, 'success').mockImplementation(() => {});
        serveAndRecord('put', '/clients/:id/activate', () => HttpResponse.json({ id: 7, active: true }));
        const listRequests = serveAndRecord('get', '/clients');
        const { result } = renderHook(useClients);

        await act(() => result.current.activateClient(7));

        expect(listRequests).toHaveLength(0);
    });
});
