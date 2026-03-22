import { describe, test, expect } from 'vitest';
import { compareValues, sortByKey, sortStrings } from './sorting.js';

describe('compareValues', () => {
    test('returns negative when first string comes before second', () => {
        expect(compareValues('a', 'b')).toBeLessThan(0);
    });

    test('returns positive when first string comes after second', () => {
        expect(compareValues('b', 'a')).toBeGreaterThan(0);
    });

    test('returns 0 for equal strings', () => {
        expect(compareValues('a', 'a')).toBe(0);
    });

    test('returns negative for smaller number', () => {
        expect(compareValues(1, 2)).toBeLessThan(0);
    });

    test('returns positive for larger number', () => {
        expect(compareValues(2, 1)).toBeGreaterThan(0);
    });

    test('returns 0 for equal numbers', () => {
        expect(compareValues(5, 5)).toBe(0);
    });
});

describe('sortByKey', () => {
    test('sorts objects by string key ascending', () => {
        const arr = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
        const sorted = sortByKey(arr, 'name');
        expect(sorted[0].name).toBe('a');
        expect(sorted[1].name).toBe('b');
        expect(sorted[2].name).toBe('c');
    });

    test('sorts objects by string key descending', () => {
        const arr = [{ name: 'b' }, { name: 'a' }, { name: 'c' }];
        const sorted = sortByKey(arr, 'name', 'descending');
        expect(sorted[0].name).toBe('c');
        expect(sorted[2].name).toBe('a');
    });

    test('sorts objects by numeric key ascending', () => {
        const arr = [{ score: 3 }, { score: 1 }, { score: 2 }];
        const sorted = sortByKey(arr, 'score');
        expect(sorted[0].score).toBe(1);
        expect(sorted[2].score).toBe(3);
    });

    test('does not mutate original array', () => {
        const arr = [{ name: 'b' }, { name: 'a' }];
        sortByKey(arr, 'name');
        expect(arr[0].name).toBe('b');
    });
});

describe('sortStrings', () => {
    test('sorts strings ascending', () => {
        const sorted = sortStrings(['c', 'a', 'b']);
        expect(sorted[0]).toBe('a');
        expect(sorted[2]).toBe('c');
    });

    test('sorts strings descending', () => {
        const sorted = sortStrings(['c', 'a', 'b'], 'descending');
        expect(sorted[0]).toBe('c');
        expect(sorted[2]).toBe('a');
    });

    test('does not mutate original array', () => {
        const arr = ['c', 'a', 'b'];
        sortStrings(arr);
        expect(arr).toEqual(['c', 'a', 'b']);
    });

    test('sorts Czech characters correctly', () => {
        const sorted = sortStrings(['Žena', 'Adam', 'Čas']);
        expect(sorted[0]).toBe('Adam');
    });
});
