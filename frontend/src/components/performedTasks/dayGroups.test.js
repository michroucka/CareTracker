import { describe, expect, it } from "vitest";
import { dayKey, summarizeByDay } from "./dayGroups";

describe("dayKey", () => {
    it("takes the day part of a local date-time", () => {
        expect(dayKey("2026-11-08T23:30:00")).toBe("2026-11-08");
    });

    it("keeps a plain date", () => {
        expect(dayKey("2026-11-08")).toBe("2026-11-08");
    });
});

describe("summarizeByDay", () => {
    it("returns an empty map without records", () => {
        expect(summarizeByDay([]).size).toBe(0);
    });

    it("counts records and sums prices per day", () => {
        const summaries = summarizeByDay([
            { date: "2026-11-08T08:00:00", price: 120 },
            { date: "2026-11-09T09:00:00", price: 50 },
            { date: "2026-11-08T23:59:00", price: 30 },
        ]);

        expect(Object.fromEntries(summaries)).toEqual({
            "2026-11-08": { count: 2, price: 150 },
            "2026-11-09": { count: 1, price: 50 },
        });
    });

    it("counts a record without a price as zero", () => {
        const summaries = summarizeByDay([{ date: "2026-11-08T08:00:00", price: null }, { date: "2026-11-08T09:00:00" }]);

        expect(summaries.get("2026-11-08")).toEqual({ count: 2, price: 0 });
    });
});
