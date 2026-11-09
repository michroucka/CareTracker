import { afterEach, describe, expect, it, vi } from "vitest";
import process from "node:process";
import { addMonths, fromIsoDate, toLocalDate, todayIsoDate, toIsoDate } from "./dates";

const TIME_ZONES = ["Europe/Prague", "UTC", "America/New_York", "Pacific/Kiritimati"];
const originalTimeZone = process.env.TZ;

function useTimeZone(timeZone) {
    process.env.TZ = timeZone;
}

function everyDayOf(year) {
    const days = [];
    for (let date = new Date(Date.UTC(year, 0, 1)); date.getUTCFullYear() === year; date.setUTCDate(date.getUTCDate() + 1)) {
        days.push(date.toISOString().slice(0, 10));
    }
    return days;
}

function restoreTimeZone() {
    // assigning undefined would store the string "undefined", which Node reads as UTC
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
}

afterEach(() => {
    restoreTimeZone();
    vi.useRealTimers();
});

describe("fromIsoDate", () => {
    it("returns local midnight of the given day", () => {
        const date = fromIsoDate("2026-11-08");

        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 8]);
        expect([date.getHours(), date.getMinutes()]).toEqual([0, 0]);
    });

    it.each([undefined, null, ""])("returns undefined for %j", (input) => {
        expect(fromIsoDate(input)).toBeUndefined();
    });

    it("returns an invalid Date for text that is not a date", () => {
        expect(Number.isNaN(fromIsoDate("not-a-date").getTime())).toBe(true);
    });

    it("does not validate the day: 30 February rolls over into March", () => {
        expect(toIsoDate(fromIsoDate("2026-02-30"))).toBe("2026-03-02");
    });

    it.each(TIME_ZONES)("keeps the calendar day in %s", (timeZone) => {
        useTimeZone(timeZone);

        const date = fromIsoDate("2026-03-01");

        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 1]);
    });
});

describe("toIsoDate", () => {
    it("formats a local Date as YYYY-MM-DD with leading zeros", () => {
        expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    });

    it.each([undefined, null])("returns an empty string for %j", (input) => {
        expect(toIsoDate(input)).toBe("");
    });

    it("uses the local day, not the UTC day, late in the evening", () => {
        useTimeZone("America/New_York");

        expect(toIsoDate(new Date(2026, 10, 30, 23, 30))).toBe("2026-11-30");
    });

    it("uses the local day, not the UTC day, early in the morning", () => {
        useTimeZone("Pacific/Kiritimati");

        expect(toIsoDate(new Date(2026, 11, 1, 0, 30))).toBe("2026-12-01");
    });

    it("never returns something that looks like a date for an invalid Date", () => {
        expect(toIsoDate(new Date("nonsense"))).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe("fromIsoDate and toIsoDate round trip", () => {
    it.each(TIME_ZONES)("every day of 2028 (leap year, month and year turns, DST) survives in %s", (timeZone) => {
        useTimeZone(timeZone);

        for (const day of everyDayOf(2028)) {
            expect(toIsoDate(fromIsoDate(day))).toBe(day);
        }
    });

    it.each(["2025-12-31", "2026-01-01", "2026-02-28", "2026-03-01", "2026-03-29", "2026-10-25"])("%s survives in Europe/Prague", (day) => {
        useTimeZone("Europe/Prague");

        expect(toIsoDate(fromIsoDate(day))).toBe(day);
    });
});

describe("todayIsoDate", () => {
    it.each([
        ["one minute before midnight", new Date(2026, 10, 8, 23, 59), "2026-11-08"],
        ["one minute after midnight", new Date(2026, 10, 9, 0, 1), "2026-11-09"],
        ["on New Year's Eve", new Date(2026, 11, 31, 12, 0), "2026-12-31"],
    ])("returns the local day %s", (_label, now, expected) => {
        vi.useFakeTimers();
        vi.setSystemTime(now);

        expect(todayIsoDate()).toBe(expected);
    });
});

describe("toLocalDate", () => {
    afterEach(() => useTimeZone(originalTimeZone));

    it.each(TIME_ZONES)("reads a date-only string as that calendar day in %s", (timeZone) => {
        useTimeZone(timeZone);

        expect(toIsoDate(toLocalDate("1950-03-15"))).toBe("1950-03-15");
    });

    it("reads a date-time string and a Date as they are", () => {
        const date = new Date(2026, 10, 9, 14, 30);

        expect(toLocalDate(date).getTime()).toBe(date.getTime());
        expect(toLocalDate("2026-11-09T14:30:00").getHours()).toBe(14);
    });
});

describe("addMonths", () => {
    it.each([
        ["2026-03-15", 6, "2026-09-15"],
        ["2026-08-31", 6, "2027-02-28"],
        ["2027-08-31", 6, "2028-02-29"],
        ["2026-05-31", 6, "2026-11-30"],
        ["2026-12-31", 2, "2027-02-28"],
    ])("%s + %i months → %s", (start, months, expected) => {
        expect(toIsoDate(addMonths(fromIsoDate(start), months))).toBe(expected);
    });
});
