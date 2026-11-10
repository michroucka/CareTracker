import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEditingWhileOpen } from './useEditingWhileOpen';
import { useRecordDetail } from './useRecordDetail';
import { useValueChange } from './useValueChange';

/** Fetch whose answers the test releases by hand, in any order. */
function controlledFetch() {
    const pending = new Map();
    const fetchRecord = vi.fn((id) => new Promise((resolve, reject) => pending.set(id, { resolve, reject })));
    const answer = (id) => act(async () => pending.get(id).resolve({ id, name: `Záznam ${id}` }));
    const fail = (id) => act(async () => pending.get(id).reject(new Error('Záznam neexistuje')));
    return { fetchRecord, answer, fail };
}

describe('useRecordDetail', () => {
    it('loads the opened record and lets an edit replace it', async () => {
        const { fetchRecord, answer } = controlledFetch();
        const { result } = renderHook(() => useRecordDetail(4, fetchRecord, vi.fn()));

        expect(result.current[0]).toBeNull();
        await answer(4);
        expect(result.current[0]).toEqual({ id: 4, name: 'Záznam 4' });

        act(() => result.current[1]({ id: 4, name: 'Upravený' }));
        expect(result.current[0]).toEqual({ id: 4, name: 'Upravený' });
    });

    it('shows nothing instead of the previous record while another one loads', async () => {
        const { fetchRecord, answer } = controlledFetch();
        const { result, rerender } = renderHook(({ id }) => useRecordDetail(id, fetchRecord, vi.fn()), { initialProps: { id: 4 } });
        await answer(4);

        rerender({ id: 5 });

        expect(result.current[0]).toBeNull();
        await answer(5);
        expect(result.current[0]).toEqual({ id: 5, name: 'Záznam 5' });
    });

    it('drops the answer for a record the user has already left', async () => {
        const { fetchRecord, answer } = controlledFetch();
        const { result, rerender } = renderHook(({ id }) => useRecordDetail(id, fetchRecord, vi.fn()), { initialProps: { id: 4 } });
        rerender({ id: 5 });
        await answer(5);

        await answer(4);

        expect(result.current[0]).toEqual({ id: 5, name: 'Záznam 5' });
    });

    it('reports a record that cannot be loaded, but not one the user has left', async () => {
        const { fetchRecord, fail } = controlledFetch();
        const onLoadFailed = vi.fn();
        const { rerender } = renderHook(({ id }) => useRecordDetail(id, fetchRecord, onLoadFailed), { initialProps: { id: 4 } });
        rerender({ id: 5 });

        await fail(4);
        expect(onLoadFailed).not.toHaveBeenCalled();

        await fail(5);
        await waitFor(() => expect(onLoadFailed).toHaveBeenCalledTimes(1));
    });

    it('loads nothing without an opened record', () => {
        const { fetchRecord } = controlledFetch();
        const { result } = renderHook(() => useRecordDetail(null, fetchRecord, vi.fn()));

        expect(result.current[0]).toBeNull();
        expect(fetchRecord).not.toHaveBeenCalled();
    });
});

describe('useEditingWhileOpen', () => {
    it('leaves edit mode when the sheet closes', () => {
        const { result, rerender } = renderHook(({ open }) => useEditingWhileOpen(open), { initialProps: { open: true } });
        act(() => result.current[1](true));
        expect(result.current[0]).toBe(true);

        rerender({ open: false });
        expect(result.current[0]).toBe(false);

        rerender({ open: true });
        expect(result.current[0]).toBe(false);
    });
});

describe('useValueChange', () => {
    it('calls back only when the value changes', () => {
        const onChange = vi.fn();
        const { rerender } = renderHook(({ value }) => useValueChange(value, onChange), { initialProps: { value: 'a' } });

        rerender({ value: 'a' });
        expect(onChange).not.toHaveBeenCalled();

        rerender({ value: 'b' });
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
    });
});
