import { expect, test } from "./support/test.js";
import { storageStateOf } from "./support/accounts.js";

test.use({ storageState: storageStateOf("caregiver") });

// drawn by the browser, so it is surely an image the browser can decode
async function drawPhoto(page) {
    const dataUrl = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        const context = canvas.getContext("2d");
        context.fillStyle = "#c0392b";
        context.fillRect(0, 0, 64, 64);
        return canvas.toDataURL("image/png");
    });
    return { name: "photo.png", mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1], "base64") };
}

test("caregiver uploads a profile photo and removes it again", async ({ page }) => {
    await page.goto("/account");

    await page.locator("#account-picture").setInputFiles(await drawPhoto(page));
    // the preview shows right away, the upload is done with the toast
    await expect(page.getByText("Fotka uložena")).toBeVisible();

    await page.reload();
    const photo = page.locator("main img, #content img").first();
    await expect(photo).toBeVisible();
    // the image really comes from the backend, not from the preview of the picked file
    expect(await photo.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(await photo.getAttribute("src")).toContain("/api/");

    // back to the seed state, so a rerun starts without a photo
    await page.getByRole("button", { name: "Odebrat" }).click();
    await expect(page.getByText("Fotka odebrána")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nahrát fotografii" })).toBeVisible();
});
