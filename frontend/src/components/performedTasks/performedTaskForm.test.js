import { describe, expect, it } from "vitest";
import { requiredCaregiverId, validatePerformedTask } from "./performedTaskForm";

const validValues = { clientId: 1, taskId: 2, date: "2026-11-02", time: "09:00", unitCount: "60", caregiverIds: [7] };

describe("validatePerformedTask", () => {
    it("accepts a caregiver who is among the caregivers", () => {
        expect(validatePerformedTask(validValues, undefined, 7)).toEqual({});
    });

    it("rejects a caregiver who left themselves out", () => {
        const errors = validatePerformedTask({ ...validValues, caregiverIds: [8] }, undefined, 7);

        expect(errors.caregiverIds).toBe("Mezi pečovateli musíte být i vy");
    });

    it("lets other roles record work of any caregiver", () => {
        expect(validatePerformedTask({ ...validValues, caregiverIds: [8] }, undefined, null)).toEqual({});
    });
});

describe("requiredCaregiverId", () => {
    it("is the employee for a caregiver and nobody for other roles", () => {
        expect(requiredCaregiverId({ role: "CAREGIVER", employeeId: 7 })).toBe(7);
        expect(requiredCaregiverId({ role: "COORDINATOR", employeeId: 3 })).toBeNull();
    });
});
