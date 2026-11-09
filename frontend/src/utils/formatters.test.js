import { afterEach, describe, test, expect } from 'vitest';
import process from 'node:process';
import {
    formatNumber,
    formatPhoneNumber,
    formatPostalCode,
    removeDiacritics,
    formatDate,
    formatDateTime,
    formatTime,
} from './formatters.js';

const normalizeSpaces = (text) => text.replace(/\s/g, ' ');
const originalTimeZone = process.env.TZ;

afterEach(() => {
    // assigning undefined would store the string "undefined", which Node reads as UTC
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
});

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

describe('formatNumber – Czech format', () => {
    test('uses a space as thousands separator and a comma for decimals', () => {
        expect(normalizeSpaces(formatNumber(1234567.5))).toBe('1 234 567,5');
    });

    test('rounds to two decimals by default', () => {
        expect(formatNumber(1.006)).toBe('1,01');
    });

    test('pads to the minimum number of decimals', () => {
        expect(formatNumber(2, { minDecimals: 2 })).toBe('2,00');
    });

    test('formats zero', () => {
        expect(formatNumber(0)).toBe('0');
    });

    test('formats a numeric string', () => {
        expect(normalizeSpaces(formatNumber('1500'))).toBe('1 500');
    });
});

describe('formatPhoneNumber – edge cases', () => {
    test.each([
        ['', ''],
        ['+', '+'],
        ['+42', '+42'],
        ['+420123', '+420 123'],
        ['+420 123-456', '+420 123 456'],
        ['+420123456789999', '+420 123 456 789'],
        ['1234567890', '123 456 789'],
        ['12+34', '123 4'],
        ['(123) 456', '123 456'],
    ])('%j → %j', (input, expected) => {
        expect(formatPhoneNumber(input)).toBe(expected);
    });

    test('is idempotent on already formatted numbers', () => {
        expect(formatPhoneNumber('+420 123 456 789')).toBe('+420 123 456 789');
        expect(formatPhoneNumber('123 456 789')).toBe('123 456 789');
    });
});

describe('formatPostalCode – edge cases', () => {
    test.each([
        ['', ''],
        ['3010', '301 0'],
        ['301 00', '301 00'],
        ['PSČ 301-00', '301 00'],
    ])('%j → %j', (input, expected) => {
        expect(formatPostalCode(input)).toBe(expected);
    });
});

describe('removeDiacritics – edge cases', () => {
    test('returns empty string for undefined', () => {
        expect(removeDiacritics(undefined)).toBe('');
    });

    test('handles every Czech accented letter', () => {
        expect(removeDiacritics('ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ áčďéěíňóřšťúůýž')).toBe('acdeeinorstuuyz acdeeinorstuuyz');
    });

    test('keeps text without diacritics apart from lowercasing', () => {
        expect(removeDiacritics('Plzen 2')).toBe('plzen 2');
    });
});

describe('formatDate – exact output', () => {
    test('formats a Date object as D. M. YYYY', () => {
        expect(normalizeSpaces(formatDate(new Date(2024, 11, 13)))).toBe('13. 12. 2024');
    });

    test('formats a date-time string in local time', () => {
        expect(normalizeSpaces(formatDate('2024-12-13T23:30:00'))).toBe('13. 12. 2024');
    });

    test('shows the same day for a date-only string west of UTC', () => {
        process.env.TZ = 'America/New_York';

        expect(normalizeSpaces(formatDate('1950-03-15'))).toBe('15. 3. 1950');
    });
});

describe('formatDateTime – exact output', () => {
    test('returns empty string for empty input', () => {
        expect(formatDateTime('')).toBe('');
    });

    test('formats date and time with leading zeros in the time', () => {
        expect(normalizeSpaces(formatDateTime(new Date(2024, 11, 13, 9, 5)))).toBe('13. 12. 2024 09:05');
    });

    test('formats a local date-time string', () => {
        expect(normalizeSpaces(formatDateTime('2024-06-15T14:30:00'))).toBe('15. 6. 2024 14:30');
    });
});

describe('formatTime', () => {
    test('returns empty string for null', () => {
        expect(formatTime(null)).toBe('');
    });

    test('formats a Date object as HH:MM', () => {
        expect(formatTime(new Date(2024, 5, 15, 9, 5))).toBe('09:05');
    });

    test('formats a local date-time string', () => {
        expect(formatTime('2024-06-15T23:59:00')).toBe('23:59');
    });
});
