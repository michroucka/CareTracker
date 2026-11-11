import { expect, test as base } from "@playwright/test";

/** Playwright `test` that fails whenever the page reports a Content Security Policy violation. */
export const test = base.extend({
    cspViolations: [
        async ({ page }, use) => {
            const violations = [];
            page.on("console", (message) => {
                if (message.type() === "error" && message.text().includes("Content Security Policy")) violations.push(message.text());
            });
            await use(violations);
            expect(violations, "Content Security Policy violations").toEqual([]);
        },
        { auto: true },
    ],
});

export { expect };
