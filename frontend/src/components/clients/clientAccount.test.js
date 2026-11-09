import { describe, expect, it } from "vitest";
import { canResendClientActivation, clientAccountState } from "./clientAccount";

const NO_ACCOUNT = { userAccountActive: null, userAccountActivated: null };
const PENDING = { userAccountActive: true, userAccountActivated: false };
const ACTIVE = { userAccountActive: true, userAccountActivated: true };
const BLOCKED = { userAccountActive: false, userAccountActivated: true };

describe("clientAccountState", () => {
    it.each([
        ["no account", NO_ACCOUNT, "Bez účtu"],
        ["pending account", PENDING, "Čeká na aktivaci"],
        ["active account", ACTIVE, "Aktivní účet"],
        ["blocked account", BLOCKED, "Zablokovaný účet"],
        ["blocked pending account", { userAccountActive: false, userAccountActivated: false }, "Zablokovaný účet"],
    ])("labels %s", (_, client, label) => {
        expect(clientAccountState(client).label).toBe(label);
    });
});

describe("canResendClientActivation", () => {
    it("offers resend only for an account waiting for activation", () => {
        expect(canResendClientActivation(PENDING)).toBe(true);
        expect(canResendClientActivation(NO_ACCOUNT)).toBe(false);
        expect(canResendClientActivation(ACTIVE)).toBe(false);
        expect(canResendClientActivation(BLOCKED)).toBe(false);
    });
});
