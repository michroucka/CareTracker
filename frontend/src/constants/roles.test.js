import { describe, expect, it } from "vitest";
import { getRoleLabel, hasRole } from "./roles";

describe("getRoleLabel", () => {
    it.each([
        ["SUPERADMIN", "Superadmin"],
        ["ADMIN", "Administrátor"],
        ["COORDINATOR", "Koordinátor"],
        ["CAREGIVER", "Pečovatel"],
        ["CLIENT", "Klient"],
        ["MANAGER", "Vedoucí"],
    ])("%s → %s", (role, label) => {
        expect(getRoleLabel(role)).toBe(label);
    });

    it("passes an unknown role through", () => {
        expect(getRoleLabel("AUDITOR")).toBe("AUDITOR");
    });
});

describe("hasRole", () => {
    it("allows a listed role", () => {
        expect(hasRole("ADMIN", ["SUPERADMIN", "ADMIN"])).toBe(true);
    });

    it("refuses a role that is not listed", () => {
        expect(hasRole("CAREGIVER", ["SUPERADMIN", "ADMIN"])).toBe(false);
    });

    it.each([undefined, null, []])("does not restrict without allowed roles (%j)", (allowedRoles) => {
        expect(hasRole("CLIENT", allowedRoles)).toBe(true);
    });

    it("refuses a missing user role when roles are restricted", () => {
        expect(hasRole(undefined, ["ADMIN"])).toBe(false);
    });
});
