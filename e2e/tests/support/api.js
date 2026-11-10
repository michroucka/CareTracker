// Backend calls in the signed-in user's session, for cleaning up after a test.
// Writes need the CSRF token from the XSRF-TOKEN cookie in the X-XSRF-TOKEN header, like in the app.
async function csrfHeader(page) {
    const cookies = await page.context().cookies();
    const token = cookies.find((cookie) => cookie.name === "XSRF-TOKEN")?.value;
    return token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {};
}

export async function apiDelete(page, path) {
    const response = await page.request.delete(`/api${path}`, { headers: await csrfHeader(page) });
    if (!response.ok()) throw new Error(`DELETE ${path} failed with ${response.status()}`);
}
