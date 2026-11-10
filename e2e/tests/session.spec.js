import { expect, test } from "@playwright/test";
import { logIn } from "./support/accounts.js";

// Each test logs in on its own: logging out ends the session, which the shared storage states must keep

test("logging out leads to the login page and closes the app", async ({ page }) => {
    await logIn(page, "coordinator");
    await expect(page.getByRole("link", { name: "Klienti" })).toBeVisible();

    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/clients");
    await expect(page).toHaveURL(/\/login/);
});

test("an expired session sends the user to the login page", async ({ page, context }) => {
    await logIn(page, "coordinator");
    await expect(page.getByRole("link", { name: "Klienti" })).toBeVisible();

    // the server forgets the session the same way when it expires; the next request gets 401
    await context.clearCookies();
    await page.getByRole("link", { name: "Klienti" }).click();

    await expect(page).toHaveURL(/\/login/);
});
