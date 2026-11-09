import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSearchParamsUpdater } from './useSearchParamsUpdater';
import { useDetailParam } from './useDetailParam';
import { usePagedList } from './usePagedList';
import { currentSearchParams, renderHookWithRouter } from '@/test/hooks';

describe('useSearchParamsUpdater', () => {
    it('changes only the given params and keeps the rest', () => {
        const { result } = renderHookWithRouter(useSearchParamsUpdater, { route: '/clients?search=Nov&status=all' });

        act(() => result.current((next) => next.set('detail', '4')));

        expect(currentSearchParams().toString()).toBe('search=Nov&status=all&detail=4');
    });

    it('keeps both updates made in the same tick', () => {
        const { result } = renderHookWithRouter(useSearchParamsUpdater, { route: '/clients' });

        act(() => {
            result.current((next) => next.set('status', 'true'));
            result.current((next) => next.set('search', 'Nov'));
        });

        expect(currentSearchParams().get('status')).toBe('true');
        expect(currentSearchParams().get('search')).toBe('Nov');
    });

    it('keeps its identity across URL changes', () => {
        const { result } = renderHookWithRouter(useSearchParamsUpdater, { route: '/clients' });
        const firstUpdater = result.current;

        act(() => result.current((next) => next.set('page', '2')));

        expect(result.current).toBe(firstUpdater);
    });

    it('replaces the history entry when asked to', () => {
        const { result } = renderHookWithRouter(useSearchParamsUpdater, { route: '/clients' });
        const historyLength = window.history.length;

        act(() => result.current((next) => next.set('status', 'all'), { replace: true }));
        expect(window.history.length).toBe(historyLength);

        act(() => result.current((next) => next.set('detail', '1')));
        expect(window.history.length).toBe(historyLength + 1);
    });
});

describe('useDetailParam', () => {
    it('reads the detail id from the URL as a number', () => {
        const { result } = renderHookWithRouter(useDetailParam, { route: '/clients?detail=12' });

        expect(result.current.detailId).toBe(12);
    });

    it('has no detail without the param', () => {
        const { result } = renderHookWithRouter(useDetailParam, { route: '/clients' });

        expect(result.current.detailId).toBeNull();
    });

    it('opens and closes the detail and keeps the filters', () => {
        const { result } = renderHookWithRouter(useDetailParam, { route: '/clients?search=Nov&status=all' });

        act(() => result.current.openDetail(7));

        expect(result.current.detailId).toBe(7);
        expect(currentSearchParams().toString()).toBe('search=Nov&status=all&detail=7');

        act(() => result.current.closeDetail());

        expect(result.current.detailId).toBeNull();
        expect(currentSearchParams().toString()).toBe('search=Nov&status=all');
    });
});

describe('usePagedList', () => {
    const rows = Array.from({ length: 60 }, (_, index) => index + 1);

    it('returns the rows of the page from the URL', () => {
        const { result } = renderHookWithRouter(() => usePagedList(rows, { pageSize: 25 }), { route: '/list?page=2' });

        expect(result.current.pageItems).toEqual(rows.slice(25, 50));
        expect(result.current.paginationProps).toMatchObject({ page: 2, pageSize: 25, totalCount: 60 });
    });

    it('shows the last page when the URL points past the end', () => {
        const { result } = renderHookWithRouter(() => usePagedList(rows, { pageSize: 25 }), { route: '/list?page=9' });

        expect(result.current.paginationProps.page).toBe(3);
        expect(result.current.pageItems).toEqual(rows.slice(50));
    });

    it('goes back to the first page when the reset key changes', () => {
        const { result, rerender } = renderHookWithRouter(
            ({ organizationId }) => usePagedList(rows, { resetKey: organizationId, pageSize: 25 }),
            { route: '/list?page=2', initialProps: { organizationId: 1 } },
        );

        rerender({ organizationId: 1 });
        expect(result.current.paginationProps.page).toBe(2);

        rerender({ organizationId: 2 });
        expect(result.current.paginationProps.page).toBe(1);
        expect(currentSearchParams().has('page')).toBe(false);
    });

    it('goes back to the first page when a wrapped filter setter is called', () => {
        const setSearch = vi.fn();
        const { result } = renderHookWithRouter(() => usePagedList(rows, { pageSize: 25 }), { route: '/list?page=3' });

        act(() => result.current.withPageReset(setSearch)('Nov'));

        expect(setSearch).toHaveBeenCalledWith('Nov');
        expect(result.current.paginationProps.page).toBe(1);
    });

    it('scrolls the table into view on a page change only when its start is above the viewport', () => {
        const { result } = renderHookWithRouter(() => usePagedList(rows, { pageSize: 25 }), { route: '/list' });
        const table = { getBoundingClientRect: () => ({ top: 40 }), scrollIntoView: vi.fn() };
        result.current.tableRef.current = table;

        act(() => result.current.paginationProps.onPageChange(2));
        expect(result.current.paginationProps.page).toBe(2);
        expect(table.scrollIntoView).not.toHaveBeenCalled();

        table.getBoundingClientRect = () => ({ top: -300 });
        act(() => result.current.paginationProps.onPageChange(3));
        expect(table.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    });
});
