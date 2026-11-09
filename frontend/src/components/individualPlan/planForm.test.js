import { afterEach, describe, expect, it, vi } from "vitest";
import process from "node:process";
import { PLAN_SECTIONS, planStatus, toFormValues, toRequest, validatePlan } from "./planForm";

const FIELD_NAMES = PLAN_SECTIONS.flatMap((section) => section.fields.map((field) => field.name));
const originalTimeZone = process.env.TZ;

function setToday(year, monthIndex, day) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(year, monthIndex, day, 12, 0));
}

afterEach(() => {
    vi.useRealTimers();
    // assigning undefined would store the string "undefined", which Node reads as UTC
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
});

describe("toFormValues", () => {
    it("starts every field empty for a new plan", () => {
        setToday(2026, 10, 8);

        const values = toFormValues(null);

        for (const name of FIELD_NAMES) expect(values[name]).toBe("");
    });

    it("copies the texts of the previous version", () => {
        setToday(2026, 10, 8);

        expect(toFormValues({ likes: "Zahrada", diet: null })).toMatchObject({ likes: "Zahrada", diet: "" });
    });

    it("processes the new version today and plans the review six months ahead", () => {
        setToday(2026, 10, 8);

        const values = toFormValues({ processedDate: "2025-01-01", plannedUpdateDate: "2025-07-01" });

        expect(values.processedDate).toBe("2026-11-08");
        expect(values.plannedUpdateDate).toBe("2027-05-08");
    });

    it("plans the review for the end of a shorter month instead of overflowing it", () => {
        setToday(2026, 7, 31);

        expect(toFormValues(null).plannedUpdateDate).toBe("2027-02-28");
    });
});

describe("validatePlan", () => {
    const processedDate = "2026-11-08";

    it("requires the planned review date", () => {
        expect(validatePlan({ processedDate, plannedUpdateDate: "" })).toEqual({ plannedUpdateDate: "Prosím zadejte datum plánované aktualizace" });
    });

    // the backend requires plannedUpdateDate.isAfter(processedDate) as well (ClientService)
    it.each(["2026-11-08", "2026-11-07", "2025-12-31"])("rejects a review on %s, not after processing", (plannedUpdateDate) => {
        expect(validatePlan({ processedDate, plannedUpdateDate })).toEqual({ plannedUpdateDate: "Aktualizace musí být až po datu zpracování" });
    });

    it.each(["2026-11-09", "2027-01-01"])("accepts a review on %s", (plannedUpdateDate) => {
        expect(validatePlan({ processedDate, plannedUpdateDate })).toEqual({});
    });
});

describe("toRequest", () => {
    it("trims texts, sends blank ones as null and keeps the dates", () => {
        const values = { ...Object.fromEntries(FIELD_NAMES.map((name) => [name, "  "])), likes: " Zahrada ", processedDate: "2026-11-08", plannedUpdateDate: "2027-05-08" };

        const request = toRequest(values);

        expect(request.likes).toBe("Zahrada");
        expect(request.diet).toBeNull();
        expect(request).toMatchObject({ processedDate: "2026-11-08", plannedUpdateDate: "2027-05-08" });
        expect(Object.keys(request)).toHaveLength(FIELD_NAMES.length + 2);
    });
});

describe("planStatus", () => {
    it.each([
        ["2026-11-07", "danger", "Po termínu 1 den"],
        ["2026-11-05", "danger", "Po termínu 3 dny"],
        ["2026-11-01", "danger", "Po termínu 7 dní"],
        ["2026-11-08", "pending", "Dnes"],
        ["2026-11-09", "pending", "Za 1 den"],
        ["2026-11-12", "pending", "Za 4 dny"],
        ["2026-11-15", "pending", "Za 7 dní"],
        ["2026-11-16", "outline", "Za 8 dní"],
    ])("review on %s seen on 2026-11-08 → %s %j", (plannedUpdateDate, variant, label) => {
        process.env.TZ = "Europe/Prague";
        setToday(2026, 10, 8);

        expect(planStatus(plannedUpdateDate)).toEqual({ variant, label });
    });

    it("counts calendar days west of UTC as well", () => {
        process.env.TZ = "America/New_York";
        setToday(2026, 10, 8);

        expect(planStatus("2026-11-10")).toEqual({ variant: "pending", label: "Za 2 dny" });
    });
});
