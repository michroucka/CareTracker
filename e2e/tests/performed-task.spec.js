import { expect, test } from "@playwright/test";
import { storageStateOf } from "./support/accounts.js";
import { apiDelete } from "./support/api.js";

test.use({ storageState: storageStateOf("coordinator") });

let createdId = null;

// other tests and reruns work with the same seed data
test.afterEach(async ({ page }) => {
    if (createdId != null) await apiDelete(page, `/performed-tasks/${createdId}`);
    createdId = null;
});

test("coordinator records a performed task and finds it in the list", async ({ page }) => {
    const note = `E2E ${Date.now()}`;
    await page.goto("/performed-tasks");

    await page.getByRole("button", { name: "Zapsat úkon" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Zapsat úkon" });

    await sheet.getByRole("combobox", { name: /^Klient/ }).click();
    const clientOption = page.getByRole("option").first();
    const clientName = (await clientOption.locator("span").first().textContent()).trim();
    await clientOption.click();

    // the whole catalog, so the seed task is offered whatever the client's plan holds
    const allTasks = sheet.getByRole("checkbox", { name: /Nabízet všechny úkony/ });
    if (await allTasks.count()) await allTasks.check();
    await sheet.getByRole("combobox", { name: /^Úkon/ }).click();
    await page.getByRole("option", { name: "Doprovod" }).click();

    // a random distance tells this record apart from others of the same client at the same time
    // (the last digit is never 0, the list would drop it)
    const randomDigit = (from) => from + Math.floor(Math.random() * (10 - from));
    const distance = `${randomDigit(1)}${randomDigit(0)},${randomDigit(0)}${randomDigit(1)}`;
    await sheet.getByLabel("Množství (km)").fill(distance);
    await sheet.getByLabel("Poznámka").fill(note);

    const created = page.waitForResponse((response) => response.url().endsWith("/api/performed-tasks") && response.request().method() === "POST");
    await sheet.getByRole("button", { name: "Zapsat úkon" }).click();
    const response = await created;
    expect(response.ok()).toBe(true);
    createdId = (await response.json()).id;
    await expect(sheet).toBeHidden();

    // reload so the row comes from the backend, not from the list state updated after the create
    await page.reload();
    await page.getByPlaceholder("Hledat podle klienta nebo úkonu…").fill(clientName);
    const row = page.getByRole("row").filter({ hasText: clientName }).filter({ hasText: `${distance} km` });
    await row.click();

    await expect(page.getByRole("dialog")).toContainText(note);
});
