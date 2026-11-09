import { afterEach, describe, expect, it, vi } from "vitest";
import {
    daysFromToday, formatAgo, formatCompact, formatCount, formatCurrency, formatDuration, formatLongDate, formatRecordDate,
    getGreeting, lastTwelveMonthLabels, monthWorkdays, pluralize, previousMonthDative, projectedChange, projectMonthEnd,
} from "./dashboardFormat";

const DAY_FORMS = ["den", "dny", "dní"];
const MONTH_NAMES = ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"];
const normalizeSpaces = (text) => text.replace(/\s/g, " ");

function setNow(date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
}

afterEach(() => vi.useRealTimers());

describe("pluralize", () => {
    it.each([
        [1, "den"], [2, "dny"], [4, "dny"], [5, "dní"], [0, "dní"], [11, "dní"], [22, "dní"],
        [-1, "den"], [-3, "dny"], [-5, "dní"],
    ])("%i → %s", (count, expected) => {
        expect(pluralize(count, DAY_FORMS)).toBe(expected);
    });
});

describe("formatDuration", () => {
    it.each([
        [0, "0 min"], [45, "45 min"], [60, "1 h"], [750, "12 h 30 min"], [61, "1 h 1 min"],
    ])("%i minutes → %s", (minutes, expected) => {
        expect(formatDuration(minutes)).toBe(expected);
    });

    it("treats a missing value as zero", () => {
        expect(formatDuration()).toBe("0 min");
    });
});

describe("number formats", () => {
    it("formats currency without decimals", () => {
        expect(normalizeSpaces(formatCurrency(1234.6))).toBe("1 235 Kč");
    });

    it.each([null, undefined])("formats a missing amount (%j) as zero crowns", (value) => {
        expect(normalizeSpaces(formatCurrency(value))).toBe("0 Kč");
    });

    it("formats counts with thousands separators and a missing count as zero", () => {
        expect(normalizeSpaces(formatCount(12345))).toBe("12 345");
        expect(formatCount(null)).toBe("0");
    });

    it.each([
        [265400, "265 tis."],
        [1234567, "1,23 mil."],
        [999, "999"],
    ])("formats %i compactly as %s", (value, expected) => {
        expect(normalizeSpaces(formatCompact(value))).toBe(expected);
    });

    it("formats a long date with the weekday", () => {
        expect(formatLongDate(new Date(2026, 10, 9))).toBe("pondělí 9. listopadu");
    });
});

describe("daysFromToday", () => {
    it.each([
        ["today earlier", new Date(2026, 10, 9, 0, 5), 0],
        ["today later", new Date(2026, 10, 9, 23, 55), 0],
        ["yesterday late in the evening", new Date(2026, 10, 8, 23, 59), -1],
        ["tomorrow just after midnight", new Date(2026, 10, 10, 0, 1), 1],
        ["across a month turn", new Date(2026, 9, 31, 12, 0), -9],
    ])("counts calendar days, not 24-hour periods: %s", (_label, date, expected) => {
        setNow(new Date(2026, 10, 9, 12, 0));

        expect(daysFromToday(date)).toBe(expected);
    });

    it("rounds over a daylight saving change", () => {
        setNow(new Date(2026, 2, 30, 12, 0));

        expect(daysFromToday(new Date(2026, 2, 28, 12, 0))).toBe(-2);
    });
});

describe("formatRecordDate", () => {
    it.each([
        ["today", new Date(2026, 10, 9, 14, 30), "Dnes 14:30"],
        ["yesterday", new Date(2026, 10, 8, 9, 5), "Včera 09:05"],
        ["earlier", new Date(2026, 10, 5, 9, 5), "5. 11."],
    ])("%s", (_label, date, expected) => {
        setNow(new Date(2026, 10, 9, 18, 0));

        expect(normalizeSpaces(formatRecordDate(date))).toBe(expected);
    });
});

describe("formatAgo", () => {
    it.each([
        [1, "před 1 dnem"],
        [3, "před 3 dny"],
        [13, "před 13 dny"],
        [14, "před 2 týdny"],
        [59, "před 8 týdny"],
        [60, "před 2 měsíci"],
        [400, "před 13 měsíci"],
    ])("%i days ago → %s", (days, expected) => {
        setNow(new Date(2026, 10, 9, 12, 0));

        expect(formatAgo(new Date(2026, 10, 9 - days, 10, 0))).toBe(expected);
    });

    it("says today for activity from today", () => {
        setNow(new Date(2026, 10, 9, 12, 0));

        expect(formatAgo(new Date(2026, 10, 9, 8, 0))).toBe("dnes");
    });
});

describe("getGreeting", () => {
    it.each([
        [0, "Dobré ráno"], [9, "Dobré ráno"], [10, "Dobrý den"], [17, "Dobrý den"], [18, "Dobrý večer"], [23, "Dobrý večer"],
    ])("%i:00 → %s", (hour, expected) => {
        expect(getGreeting(new Date(2026, 10, 9, hour, 0))).toBe(expected);
    });
});

describe("lastTwelveMonthLabels", () => {
    it("lists the last twelve months oldest first, across a year turn", () => {
        setNow(new Date(2026, 0, 15));

        expect(lastTwelveMonthLabels(MONTH_NAMES)).toEqual(["úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro", "led"]);
    });

    it("does not skip February at the end of a long month", () => {
        setNow(new Date(2026, 2, 31));

        expect(lastTwelveMonthLabels(MONTH_NAMES).slice(-2)).toEqual(["úno", "bře"]);
    });
});

describe("monthWorkdays", () => {
    it.each([
        ["before the first workday", new Date(2026, 10, 1), 21, 0],
        ["on the first workday", new Date(2026, 10, 2), 21, 1],
        ["after a weekend", new Date(2026, 10, 9), 21, 6],
        ["on the last day", new Date(2026, 10, 30), 21, 21],
        ["in February", new Date(2026, 1, 28), 20, 20],
    ])("November 2026 and February 2026: %s", (_label, now, total, elapsed) => {
        expect(monthWorkdays(now)).toEqual({ total, elapsed });
    });
});

describe("projectMonthEnd", () => {
    it("extrapolates the pace per workday to the whole month", () => {
        expect(projectMonthEnd(600, new Date(2026, 10, 9))).toBe(2100);
    });

    it("returns null before the first workday", () => {
        expect(projectMonthEnd(600, new Date(2026, 10, 1))).toBeNull();
    });
});

describe("previousMonthDative", () => {
    it.each([
        ["in November", new Date(2026, 10, 9), "říjnu"],
        ["in January", new Date(2026, 0, 31), "prosinci"],
        ["on 31 March", new Date(2026, 2, 31), "únoru"],
    ])("%s", (_label, now, expected) => {
        expect(previousMonthDative(now)).toBe(expected);
    });
});

describe("projectedChange", () => {
    it("returns the relative change", () => {
        expect(projectedChange(110, 100)).toBeCloseTo(0.1);
        expect(projectedChange(50, 100)).toBeCloseTo(-0.5);
    });

    it.each([
        [null, 100],
        [100, 0],
        [100, null],
    ])("returns null with nothing to compare (%j, %j)", (projected, previous) => {
        expect(projectedChange(projected, previous)).toBeNull();
    });
});
