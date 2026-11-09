import { describe, expect, it } from "vitest";
import { emptyClient, validateClient } from "./clientForm";

const personalNumberError = (personalNumber) =>
    validateClient({ ...emptyClient(1), personalNumber }).personalNumber;

describe("validateClient – personal number", () => {
    it.each(["", "1", "999999"])("accepts %j", (personalNumber) => {
        expect(personalNumberError(personalNumber)).toBeUndefined();
    });

    it.each(["0", "000000", "1000000"])("rejects %j, the variable symbol has room for six digits", (personalNumber) => {
        expect(personalNumberError(personalNumber)).toBe("Osobní číslo musí být mezi 1 a 999999");
    });

    it("rejects non-digits", () => {
        expect(personalNumberError("12a")).toBe("Osobní číslo může obsahovat jen číslice");
    });
});
