import { expect, test } from "./support/test.js";
import { storageStateOf } from "./support/accounts.js";

// only an admin or the client's key worker may change the plan
test.use({ storageState: storageStateOf("admin") });

// Gaspard Drysdall from the demo seed: active, with a plan
const CLIENT_WITH_PLAN = 24;

test("admin saves a new version of the individual plan and adds a daily record", async ({ page }) => {
    const diet = `E2E strava ${Date.now()}`;
    const dailyRecord = `E2E den ${Date.now()}`;
    await page.goto(`/clients/${CLIENT_WITH_PLAN}/individual-plan`);

    await page.getByRole("button", { name: "Nová verze" }).click();
    await page.getByLabel("Stravování").fill(diet);
    await page.getByRole("button", { name: "Uložit novou verzi" }).click();
    await expect(page.getByRole("button", { name: "Nová verze" })).toBeVisible();

    await page.getByRole("button", { name: "Přidat záznam" }).click();
    const recordDialog = page.getByRole("dialog");
    await recordDialog.getByLabel("Záznam").fill(dailyRecord);
    await recordDialog.getByRole("button", { name: "Uložit záznam" }).click();
    await expect(recordDialog).toBeHidden();

    await page.reload();
    await expect(page.getByText(diet)).toBeVisible();
    await expect(page.getByText(dailyRecord)).toBeVisible();
});
