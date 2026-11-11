import { expect, test } from "./support/test.js";
import { storageStateOf } from "./support/accounts.js";

const STAFF_ITEMS = ["Nástěnka", "Klienti", "Provedené úkony", "Zaměstnanci", "Úkony"];

const SIDEBAR_BY_ACCOUNT = {
    superadmin: [...STAFF_ITEMS, "Střediska", "Organizace"],
    admin: [...STAFF_ITEMS, "Střediska"],
    coordinator: STAFF_ITEMS,
    caregiver: STAFF_ITEMS,
    client: ["Měsíční přehled"],
};

for (const [username, items] of Object.entries(SIDEBAR_BY_ACCOUNT)) {
    test.describe(username, () => {
        test.use({ storageState: storageStateOf(username) });

        test("sees only the pages of their role in the sidebar", async ({ page }) => {
            await page.goto("/");

            const navigation = page.getByRole("list").filter({ has: page.getByRole("link", { name: items[0], exact: true }) });
            await expect(navigation.getByRole("link")).toHaveText(items);
        });
    });
}

test.describe("caregiver", () => {
    test.use({ storageState: storageStateOf("caregiver") });

    test("is sent away from a page of another role", async ({ page }) => {
        await page.goto("/departments");

        await expect(page).toHaveURL("/");
        await expect(page.getByText("Nedostatečná oprávnění")).toBeVisible();
    });
});
