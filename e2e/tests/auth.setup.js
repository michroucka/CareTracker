import { expect, test as setup } from "./support/test.js";
import { ACCOUNTS, logIn, storageStateOf } from "./support/accounts.js";

// Logs every demo account in once; tests start already signed in through `test.use({ storageState })`
for (const username of ACCOUNTS) {
    setup(`log in as ${username}`, async ({ page }) => {
        await logIn(page, username);
        await expect(page).not.toHaveURL(/\/login/);
        await page.context().storageState({ path: storageStateOf(username) });
    });
}
