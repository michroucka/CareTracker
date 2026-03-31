import { describe, test, expect } from 'vitest';
import {
    formatNumber,
    formatPhoneNumber,
    formatPostalCode,
    removeDiacritics,
    formatDate,
    formatDateTime,
} from './formatters.js';

describe('formatNumber', () => {
    test('returns empty string for null', () => {
        expect(formatNumber(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(formatNumber(undefined)).toBe('');
    });

    test('returns empty string for empty string', () => {
        expect(formatNumber('')).toBe('');
    });

    test('formats integer as non-empty string', () => {
        const result = formatNumber(42);
        expect(result).toBeTruthy();
        expect(result).toContain('42');
    });

    test('formats decimal number as non-empty string', () => {
        const result = formatNumber(1.5, { minDecimals: 1 });
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
    });
});

describe('formatPhoneNumber', () => {
    test('formats number with country code +420', () => {
        expect(formatPhoneNumber('+420123456789')).toBe('+420 123 456 789');
    });

    test('formats number without country code', () => {
        expect(formatPhoneNumber('123456789')).toBe('123 456 789');
    });

    test('formats short number without spaces', () => {
        expect(formatPhoneNumber('123')).toBe('123');
    });

    test('formats partial number with one group', () => {
        expect(formatPhoneNumber('123456')).toBe('123 456');
    });
});

describe('formatPostalCode', () => {
    test('formats 5-digit postal code as XXX XX', () => {
        expect(formatPostalCode('12345')).toBe('123 45');
    });

    test('returns short code without space', () => {
        expect(formatPostalCode('123')).toBe('123');
    });

    test('strips non-digit characters', () => {
        expect(formatPostalCode('1 2 3 4 5')).toBe('123 45');
    });

    test('truncates to 5 digits', () => {
        expect(formatPostalCode('123456789')).toBe('123 45');
    });
});

describe('removeDiacritics', () => {
    test('removes Czech diacritics and lowercases', () => {
        expect(removeDiacritics('Žluté')).toBe('zlute');
    });

    test('returns empty string for empty input', () => {
        expect(removeDiacritics('')).toBe('');
    });

    test('returns empty string for null', () => {
        expect(removeDiacritics(null)).toBe('');
    });

    test('handles mixed diacritics', () => {
        expect(removeDiacritics('Příliš žluťoučký')).toBe('prilis zlutoucky');
    });
});

describe('formatDate', () => {
    test('returns empty string for null', () => {
        expect(formatDate(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(formatDate(undefined)).toBe('');
    });

    test('formats Date object as non-empty string', () => {
        const result = formatDate(new Date(2024, 11, 13));
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
    });

    test('formats ISO string as non-empty string', () => {
        const result = formatDate('2024-06-15');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
    });
});

describe('formatDateTime', () => {
    test('returns empty string for null', () => {
        expect(formatDateTime(null)).toBe('');
    });

    test('formats Date object including time', () => {
        const result = formatDateTime(new Date(2024, 5, 15, 14, 30));
        expect(result).toBeTruthy();
        expect(result).toContain('14');
        expect(result).toContain('30');
    });
});
