import path from "node:path";

// Demo accounts from the Flyway seed, all with the same password
export const PASSWORD = "heslo";
export const ACCOUNTS = ["superadmin", "admin", "coordinator", "caregiver", "client"];

export const storageStateOf = (username) => path.join(import.meta.dirname, "../../.auth", `${username}.json`);

export async function logIn(page, username, password = PASSWORD) {
    await page.goto("/login");
    await page.getByLabel("Uživatelské jméno").fill(username);
    await page.getByLabel("Heslo", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Přihlásit se" }).click();
}
