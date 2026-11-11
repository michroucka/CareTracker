import { expect, test } from "./support/test.js";
import { storageStateOf } from "./support/accounts.js";

test("the app is served with security headers", async ({ page }) => {
    const response = await page.goto("/login");
    const headers = response.headers();

    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test.describe("coordinator", () => {
    test.use({ storageState: storageStateOf("coordinator") });

    test("prints a receipt within the content security policy", async ({ page }) => {
        await page.goto("/performed-tasks");
        const firstRecordActions = page.getByRole("button", { name: /^Akce pro záznam .+ u klienta / }).first();
        const clientName = (await firstRecordActions.getAttribute("aria-label")).replace(/^.+ u klienta /, "");

        await page.getByRole("button", { name: /Stvrzenka/ }).click();
        const dialog = page.getByRole("dialog", { name: "Stvrzenka za měsíc" });
        await dialog.getByRole("combobox", { name: /Klient/ }).click();
        await page.getByRole("option", { name: new RegExp(`^${clientName}`) }).click();
        await dialog.getByRole("button", { name: /Vytisknout/ }).click();

        // the receipt is printed from a hidden frame with the PDF as a blob: URL
        await expect(page.locator('iframe[src^="blob:"]')).toBeAttached();
        await page.waitForLoadState("networkidle");
    });
});
