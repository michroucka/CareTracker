import { describe, expect, it } from "vitest";
import { apiUrl } from "@/test/server";
import { accountState, emptyEmployee, roleOptions, toFormValues, toRequest, validateEmployee } from "./employeeForm";

const validEmployee = { ...emptyEmployee(3), firstName: "Jana", lastName: "Nová", email: "jana@example.cz" };
const roles = (options) => options.map((option) => option.value);

describe("roleOptions", () => {
    it("lets an admin assign every role", () => {
        expect(roles(roleOptions(true, "CAREGIVER"))).toEqual(["CAREGIVER", "COORDINATOR", "MANAGER"]);
    });

    it("limits others to caregivers", () => {
        expect(roles(roleOptions(false, "CAREGIVER"))).toEqual(["CAREGIVER"]);
    });

    it("keeps the employee's current role available", () => {
        expect(roles(roleOptions(false, "COORDINATOR"))).toEqual(["CAREGIVER", "COORDINATOR"]);
    });

    it("labels roles in Czech", () => {
        expect(roleOptions(true, null)[1]).toEqual({ value: "COORDINATOR", label: "Koordinátor" });
    });
});

describe("emptyEmployee", () => {
    it("starts as a caregiver with an account in the default department", () => {
        expect(emptyEmployee(3)).toMatchObject({ role: "CAREGIVER", departmentId: 3, createAccount: true, isAdmin: false });
    });

    it("leaves the department empty without a default", () => {
        expect(emptyEmployee().departmentId).toBeNull();
    });
});

describe("toFormValues", () => {
    it("matches the empty form apart from the department for a new employee", () => {
        expect(toFormValues(null)).toEqual({ ...emptyEmployee(), createAccount: false });
    });

    it("shows the full-size picture of an existing employee", () => {
        expect(toFormValues({ id: 8, pictureId: 15 }).picture).toBe(apiUrl("/employees/8/picture?size=full&v=15"));
    });

    it("has no picture when the employee has none", () => {
        expect(toFormValues({ id: 8, pictureId: null }).picture).toBeNull();
    });

    it.each([
        ["with an e-mail", "jana@example.cz", true],
        ["without an e-mail", null, false],
    ])("an employee %s has an account: %s", (_label, email, expected) => {
        expect(toFormValues({ id: 8, email }).createAccount).toBe(expected);
    });
});

describe("validateEmployee", () => {
    it("accepts a complete employee", () => {
        expect(validateEmployee(validEmployee)).toEqual({});
    });

    it("requires names and a department", () => {
        expect(validateEmployee({ ...validEmployee, firstName: " ", lastName: "", departmentId: null })).toEqual({
            firstName: "Prosím zadejte jméno",
            lastName: "Prosím zadejte příjmení",
            departmentId: "Prosím vyberte středisko",
        });
    });

    it("requires an e-mail for an account", () => {
        expect(validateEmployee({ ...validEmployee, email: "  " }).email).toBe("Prosím zadejte e-mail");
    });

    it.each(["jana", "jana@", "jana@example", "ja na@example.cz", "@example.cz"])("rejects the e-mail %j", (email) => {
        expect(validateEmployee({ ...validEmployee, email }).email).toBe("Zadejte platnou e-mailovou adresu");
    });

    it("accepts an e-mail with surrounding spaces, which are trimmed", () => {
        expect(validateEmployee({ ...validEmployee, email: " jana@example.cz " }).email).toBeUndefined();
    });

    it("ignores the e-mail without an account", () => {
        expect(validateEmployee({ ...validEmployee, createAccount: false, email: "nonsense" })).toEqual({});
    });
});

describe("toRequest", () => {
    it("sends trimmed names and the account fields with an account", () => {
        const request = toRequest({ ...validEmployee, firstName: " Jana ", email: " jana@example.cz ", isAdmin: true });

        expect(request).toEqual({
            picture: null,
            firstName: "Jana",
            lastName: "Nová",
            role: "CAREGIVER",
            departmentId: 3,
            email: "jana@example.cz",
            isAdmin: true,
        });
    });

    it("leaves out the e-mail and admin flag without an account", () => {
        const request = toRequest({ ...validEmployee, createAccount: false, isAdmin: true });

        expect(request).not.toHaveProperty("email");
        expect(request).not.toHaveProperty("isAdmin");
    });
});

describe("accountState", () => {
    it.each([
        [{ email: null }, "outline", "Bez účtu"],
        [{ email: "jana@example.cz", isActivated: false }, "pending", "Čeká na aktivaci"],
        [{ email: "jana@example.cz", isActivated: true }, "success", "Aktivní účet"],
    ])("%j → %s", (employee, variant, label) => {
        expect(accountState(employee)).toEqual({ variant, label });
    });
});
