import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useListFilters, useMonthParam, useMultiSelectParam, usePageParam, useTextParam } from './useListFilters';
import { usePagedList } from './usePagedList';
import { currentSearchParams, renderHookWithRouter } from '@/test/hooks';

const hundredRows = Array.from({ length: 100 }, (_, index) => index);

// the same composition as the PerformedTasks page: a month change clears the day and goes to the first page
function usePerformedTasksFilters() {
    const [day, setDay] = useTextParam('day');
    const [period, setPeriod] = useMonthParam();
    const { paginationProps, withPageReset } = usePagedList(hundredRows);
    const changeMonth = withPageReset((nextPeriod) => {
        setPeriod(nextPeriod);
        setDay('');
    });
    return { day, period, page: paginationProps.page, changeMonth };
}

describe('month, day and page filters', () => {
    it('reads the month, day and page from the URL', () => {
        const { result } = renderHookWithRouter(usePerformedTasksFilters, {
            route: '/performed-tasks?month=3&year=2025&day=2025-03-14&page=3',
        });

        expect(result.current.period).toEqual({ month: 2, year: 2025 });
        expect(result.current.day).toBe('2025-03-14');
        expect(result.current.page).toBe(3);
    });

    it('clears the day and the page when the month changes', () => {
        const { result } = renderHookWithRouter(usePerformedTasksFilters, {
            route: '/performed-tasks?month=3&year=2025&day=2025-03-14&page=3&detail=8',
        });

        act(() => result.current.changeMonth({ month: 4, year: 2025 }));

        expect(result.current).toMatchObject({ day: '', page: 1, period: { month: 4, year: 2025 } });
        const params = currentSearchParams();
        expect(params.get('month')).toBe('5');
        expect(params.get('year')).toBe('2025');
        expect(params.has('day')).toBe(false);
        expect(params.has('page')).toBe(false);
        expect(params.get('detail')).toBe('8');
    });
});

describe('useMonthParam', () => {
    const today = new Date();
    const currentPeriod = { month: today.getMonth(), year: today.getFullYear() };

    it('defaults to the current month and writes it to the URL', () => {
        const { result } = renderHookWithRouter(useMonthParam, { route: '/report' });

        expect(result.current[0]).toEqual(currentPeriod);
        expect(currentSearchParams().get('month')).toBe(String(currentPeriod.month + 1));
        expect(currentSearchParams().get('year')).toBe(String(currentPeriod.year));
    });

    it.each([
        ['a future month', `month=1&year=${today.getFullYear() + 1}`],
        ['month 13', 'month=13&year=2025'],
        ['month 0', 'month=0&year=2025'],
        ['a year before MIN_YEAR', 'month=5&year=1969'],
        ['text', 'month=may&year=2025'],
    ])('falls back to the current month for %s', (_, query) => {
        const { result } = renderHookWithRouter(useMonthParam, { route: `/report?${query}` });

        expect(result.current[0]).toEqual(currentPeriod);
    });
});

describe('usePageParam', () => {
    it.each([
        ['missing', '', 1],
        ['zero', 'page=0', 1],
        ['negative', 'page=-2', 1],
        ['text', 'page=abc', 1],
        ['a fraction', 'page=2.7', 2],
    ])('treats a %s page as a valid page', (_, query, expectedPage) => {
        const { result } = renderHookWithRouter(usePageParam, { route: `/list?${query}` });

        expect(result.current[0]).toBe(expectedPage);
    });

    it('leaves the param out on the first page', () => {
        const { result } = renderHookWithRouter(usePageParam, { route: '/list?page=4' });

        act(() => result.current[1](1));

        expect(currentSearchParams().has('page')).toBe(false);
    });
});

describe('useTextParam', () => {
    it('reads the text from the URL and removes the param when the text is cleared', () => {
        const { result } = renderHookWithRouter(() => useTextParam('search'), { route: '/clients?search=Nov%C3%A1' });

        expect(result.current[0]).toBe('Nová');

        act(() => result.current[1](''));

        expect(currentSearchParams().has('search')).toBe(false);
    });
});

describe('useMultiSelectParam', () => {
    it('reads a comma separated list', () => {
        const { result } = renderHookWithRouter(() => useMultiSelectParam('departments'), { route: '/list?departments=1,4' });

        expect(result.current[0]).toEqual(new Set(['1', '4']));
    });

    it('uses the initial value only when the URL has no such param', () => {
        const withoutParam = renderHookWithRouter(() => useMultiSelectParam('departments', [2]), { route: '/list' });
        expect(withoutParam.result.current[0]).toEqual(new Set(['2']));
        withoutParam.unmount();

        const withAll = renderHookWithRouter(() => useMultiSelectParam('departments', [2]), { route: '/list?departments=all' });
        expect(withAll.result.current[0]).toEqual(new Set());
    });

    it('writes an empty selection as "all"', () => {
        const { result } = renderHookWithRouter(() => useMultiSelectParam('departments', [2]), { route: '/list' });

        act(() => result.current[1](new Set()));

        expect(currentSearchParams().get('departments')).toBe('all');
    });
});

describe('useListFilters', () => {
    it.each([
        ['missing', '', new Set(['true']), true],
        ['true', 'status=true', new Set(['true']), true],
        ['false', 'status=false', new Set(['false']), false],
        ['all', 'status=all', new Set(['true', 'false']), undefined],
    ])('maps a %s status param to the filter and the API value', (_, query, statusFilter, apiStatus) => {
        const { result } = renderHookWithRouter(useListFilters, { route: `/clients?${query}` });

        expect(result.current.statusFilter).toEqual(statusFilter);
        expect(result.current.apiStatus).toBe(apiStatus);
    });

    it('keeps search and status in the URL next to other params', () => {
        const { result } = renderHookWithRouter(useListFilters, { route: '/clients?search=Nov&detail=3' });

        expect(result.current.search).toBe('Nov');

        act(() => result.current.setStatusFilter(new Set(['true', 'false'])));

        const params = currentSearchParams();
        expect(params.get('status')).toBe('all');
        expect(params.get('search')).toBe('Nov');
        expect(params.get('detail')).toBe('3');
    });
});
