import { readFile } from "node:fs/promises";
import { expect, test } from "./support/test.js";
import { storageStateOf } from "./support/accounts.js";

test.use({ storageState: storageStateOf("coordinator") });

test("coordinator downloads a client's monthly receipt as a PDF", async ({ page }) => {
    await page.goto("/performed-tasks");

    // a client from the list surely has records in the month shown
    const firstRecordActions = page.getByRole("button", { name: /^Akce pro záznam .+ u klienta / }).first();
    const clientName = (await firstRecordActions.getAttribute("aria-label")).replace(/^.+ u klienta /, "");

    await page.getByRole("button", { name: /Stvrzenka/ }).click();
    const dialog = page.getByRole("dialog", { name: "Stvrzenka za měsíc" });
    await dialog.getByRole("combobox", { name: /Klient/ }).click();
    await page.getByRole("option", { name: new RegExp(`^${clientName}`) }).click();

    const downloading = page.waitForEvent("download");
    await dialog.getByRole("button", { name: /Stáhnout PDF/ }).click();
    const download = await downloading;

    expect(download.suggestedFilename()).toMatch(/^stvrzenka-.+-\d{4}-\d{2}\.pdf$/);
    const content = await readFile(await download.path());
    expect(content.subarray(0, 5).toString()).toBe("%PDF-");
    expect(content.length).toBeGreaterThan(1000);
});
