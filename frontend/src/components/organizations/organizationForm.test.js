import { describe, expect, it } from "vitest";
import { EMPTY_ORGANIZATION, formatBankAccount, toFormValues, toRequest, validateOrganization } from "./organizationForm";

const validOrganization = { ...EMPTY_ORGANIZATION, name: "Pečovatelská služba" };
const withAccount = { ...validOrganization, accountPrefix: "19", accountNumber: "2000145399", bankCode: "0800" };

describe("toFormValues", () => {
    it("matches the empty form for a new organization", () => {
        expect(toFormValues(undefined)).toEqual(EMPTY_ORGANIZATION);
    });

    it("takes the manager id and the account parts", () => {
        const organization = { name: "Služba", manager: { id: 3 }, accountPrefix: null, accountNumber: "123456", bankCode: "0100" };

        expect(toFormValues(organization)).toEqual({ name: "Služba", managerId: 3, accountPrefix: "", accountNumber: "123456", bankCode: "0100" });
    });
});

describe("validateOrganization", () => {
    it("requires the name", () => {
        expect(validateOrganization({ ...validOrganization, name: "  " })).toEqual({ name: "Prosím zadejte název" });
    });

    it("accepts an organization without a bank account", () => {
        expect(validateOrganization(validOrganization)).toEqual({});
    });

    it("accepts a full account with a prefix", () => {
        expect(validateOrganization(withAccount)).toEqual({});
    });

    it("accepts an account without a prefix", () => {
        expect(validateOrganization({ ...withAccount, accountPrefix: "" })).toEqual({});
    });

    it("asks for the number and bank code once any account part is filled in", () => {
        expect(validateOrganization({ ...validOrganization, accountPrefix: "19" })).toEqual({
            accountNumber: "Číslo účtu má 2 až 10 číslic",
            bankCode: "Kód banky má 4 číslice",
        });
    });

    it.each([
        ["accountPrefix", "1234567", "Předčíslí má nejvýše 6 číslic"],
        ["accountPrefix", "12a", "Předčíslí má nejvýše 6 číslic"],
        ["accountNumber", "1", "Číslo účtu má 2 až 10 číslic"],
        ["accountNumber", "12345678901", "Číslo účtu má 2 až 10 číslic"],
        ["accountNumber", "12-34", "Číslo účtu má 2 až 10 číslic"],
        ["bankCode", "080", "Kód banky má 4 číslice"],
        ["bankCode", "08000", "Kód banky má 4 číslice"],
    ])("rejects %s %j", (field, value, message) => {
        expect(validateOrganization({ ...withAccount, [field]: value })).toEqual({ [field]: message });
    });

    it.each([
        ["accountPrefix", "123456"],
        ["accountNumber", "12"],
        ["accountNumber", "1234567890"],
    ])("accepts %s %j at the limit", (field, value) => {
        expect(validateOrganization({ ...withAccount, [field]: value })).toEqual({});
    });
});

describe("toRequest", () => {
    it("trims the name and sends empty account parts as null", () => {
        expect(toRequest({ ...validOrganization, name: " Služba ", accountPrefix: " " })).toEqual({
            name: "Služba",
            managerId: null,
            accountPrefix: null,
            accountNumber: null,
            bankCode: null,
        });
    });

    it("sends a filled-in account", () => {
        expect(toRequest({ ...withAccount, managerId: 3 })).toMatchObject({ managerId: 3, accountPrefix: "19", accountNumber: "2000145399", bankCode: "0800" });
    });
});

describe("formatBankAccount", () => {
    it.each([
        [{ accountPrefix: "19", accountNumber: "2000145399", bankCode: "0800" }, "19-2000145399/0800"],
        [{ accountPrefix: null, accountNumber: "2000145399", bankCode: "0800" }, "2000145399/0800"],
        [{ accountNumber: "2000145399" }, null],
        [{ bankCode: "0800" }, null],
        [null, null],
    ])("%j → %j", (organization, expected) => {
        expect(formatBankAccount(organization)).toBe(expected);
    });
});
