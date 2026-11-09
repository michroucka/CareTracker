import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { apiUrl, server } from "@/test/server";
import { deleteJSON, getJSON, post, postJSON, putJSON, uploadFile } from "./api";

function setCsrfCookie(value) {
    document.cookie = `XSRF-TOKEN=${value}; path=/`;
}

function clearCsrfCookie() {
    document.cookie = "XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/** Answers the request and remembers the CSRF header it carried. */
function recordCsrfHeader(method, path) {
    const seen = { header: undefined };
    server.use(http[method](apiUrl(path), ({ request }) => {
        seen.header = request.headers.get("X-XSRF-TOKEN");
        return HttpResponse.json({});
    }));
    return seen;
}

describe("api – CSRF token", () => {
    afterEach(clearCsrfCookie);

    it.each([
        ["post", "post", "/login", () => post("/login", { username: "jana" })],
        ["postJSON", "post", "/clients", () => postJSON("/clients", {})],
        ["putJSON", "put", "/clients/1", () => putJSON("/clients/1", {})],
        ["deleteJSON", "delete", "/clients/1", () => deleteJSON("/clients/1")],
        ["uploadFile", "post", "/clients/1/picture", () => uploadFile("/clients/1/picture", new File(["x"], "foto.jpg"))],
    ])("%s sends the token from the cookie", async (_name, method, path, send) => {
        setCsrfCookie("token%2Fwith%2Fslash");
        const seen = recordCsrfHeader(method, path);

        await send();

        expect(seen.header).toBe("token/with/slash");
    });

    it("GET sends no token", async () => {
        setCsrfCookie("abc");
        const seen = recordCsrfHeader("get", "/clients");

        await getJSON("/clients");

        expect(seen.header).toBeNull();
    });

    it("write without the cookie sends no header", async () => {
        const seen = recordCsrfHeader("post", "/clients");

        await postJSON("/clients", {});

        expect(seen.header).toBeNull();
    });
});
