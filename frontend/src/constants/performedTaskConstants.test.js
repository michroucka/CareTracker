import { describe, expect, it } from "vitest";
import { calculatePrice } from "./performedTaskConstants";

describe("calculatePrice", () => {
    it.each([
        ["an hourly task counted in minutes", { unitType: "HOUR", unitPrice: 120 }, 90, 180],
        ["an hourly task rounding half up", { unitType: "HOUR", unitPrice: 1 }, 30, 1],
        ["an hourly task rounding down", { unitType: "HOUR", unitPrice: 100 }, 1, 2],
        ["a task per occurrence", { unitType: "OCCURRENCE", unitPrice: 50 }, 3, 150],
        ["kilometres with a fraction", { unitType: "KM", unitPrice: 8 }, 12.5, 100],
        ["kilograms rounded to whole crowns", { unitType: "KG", unitPrice: 33 }, 1.5, 50],
    ])("prices %s", (_label, task, unitCount, expected) => {
        expect(calculatePrice(task, unitCount)).toBe(expected);
    });

    it.each([null, undefined])("is zero without a task (%j)", (task) => {
        expect(calculatePrice(task, 5)).toBe(0);
    });

    it("matches the backend's decimal rounding for fractional units", () => {
        expect(calculatePrice({ unitType: "KM", unitPrice: 50 }, 0.29)).toBe(15);
        expect(calculatePrice({ unitType: "KG", unitPrice: 90 }, 0.35)).toBe(32);
        expect(calculatePrice({ unitType: "HOUR", unitPrice: 100 }, 7.5)).toBe(13);
        expect(calculatePrice({ unitType: "HOUR", unitPrice: 100 }, 10)).toBe(17);
    });
});
