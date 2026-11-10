import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { apiUrl, server } from "@/test/server";
import { deleteImage, deleteJSON, fetchImage, get, getJSON, post, postJSON, putJSON, uploadFile, userMessageOf } from "./api";

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

const photo = () => new File(["jpeg"], "photo.jpg", { type: "image/jpeg" });

/** JSON helpers that throw on errors and tell the app about an expired session. */
const JSON_CALLS = [
    ["getJSON", "get", () => getJSON("/clients")],
    ["postJSON", "post", () => postJSON("/clients", { name: "Jana" })],
    ["putJSON", "put", () => putJSON("/clients", { name: "Jana" })],
    ["deleteJSON", "delete", () => deleteJSON("/clients")],
];

/** Helpers for pictures and other binary resources, which throw on errors as well. */
const FILE_CALLS = [
    ["uploadFile", "post", () => uploadFile("/clients", photo())],
    ["deleteImage", "delete", () => deleteImage("/clients")],
];

function respondWith(method, response) {
    server.use(http[method](apiUrl("/clients"), () => response()));
}

function listenForUnauthorized() {
    const listener = vi.fn();
    window.addEventListener("auth:unauthorized", listener);
    return { listener, stop: () => window.removeEventListener("auth:unauthorized", listener) };
}

describe("api – expired session (401)", () => {
    let unauthorized;
    beforeEach(() => { unauthorized = listenForUnauthorized(); });
    afterEach(() => unauthorized.stop());

    it.each(JSON_CALLS)("%s dispatches auth:unauthorized and still throws", async (_name, method, send) => {
        respondWith(method, () => HttpResponse.json({ message: "Nepřihlášen" }, { status: 401 }));

        await expect(send()).rejects.toThrow("Nepřihlášen");
        expect(unauthorized.listener).toHaveBeenCalledOnce();
    });

    it.each(JSON_CALLS)("%s does not dispatch it for other errors", async (_name, method, send) => {
        respondWith(method, () => HttpResponse.json({ message: "Zakázáno" }, { status: 403 }));

        await expect(send()).rejects.toThrow("Zakázáno");
        expect(unauthorized.listener).not.toHaveBeenCalled();
    });

    it("get returns the raw 401 response without dispatching, the caller handles it", async () => {
        respondWith("get", () => new HttpResponse(null, { status: 401 }));

        const response = await get("/clients");

        expect(response.status).toBe(401);
        expect(unauthorized.listener).not.toHaveBeenCalled();
    });

    it.each([...FILE_CALLS, ["fetchImage", "get", () => fetchImage("/clients")]])("%s dispatches auth:unauthorized as well", async (_name, method, send) => {
        respondWith(method, () => new HttpResponse(null, { status: 401 }));

        await expect(send()).rejects.toThrow();
        expect(unauthorized.listener).toHaveBeenCalledOnce();
    });
});

describe("api – error responses", () => {
    it.each([...JSON_CALLS, ...FILE_CALLS])("%s throws the server's message", async (_name, method, send) => {
        respondWith(method, () => HttpResponse.json({ message: "Klient už existuje" }, { status: 409 }));

        await expect(send()).rejects.toThrow(new Error("Klient už existuje"));
    });

    it.each([...JSON_CALLS, ...FILE_CALLS])("%s falls back to the status when the body is not JSON", async (_name, method, send) => {
        respondWith(method, () => new HttpResponse("<html>Bad Gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } }));

        await expect(send()).rejects.toThrow(new Error("HTTP error! status: 502"));
    });

    it.each([...JSON_CALLS, ...FILE_CALLS])("%s falls back to the status when the body is empty", async (_name, method, send) => {
        respondWith(method, () => new HttpResponse(null, { status: 500 }));

        await expect(send()).rejects.toThrow(new Error("HTTP error! status: 500"));
    });

    it.each(JSON_CALLS)("%s falls back to the status when the JSON has no message", async (_name, method, send) => {
        respondWith(method, () => HttpResponse.json({ error: "Internal" }, { status: 500 }));

        await expect(send()).rejects.toThrow(new Error("HTTP error! status: 500"));
    });

    it.each([...JSON_CALLS, ...FILE_CALLS, ["get", "get", () => get("/clients")], ["post", "post", () => post("/clients", {})]])(
        "%s rejects on a network error",
        async (_name, method, send) => {
            respondWith(method, () => HttpResponse.error());

            await expect(send()).rejects.toThrow(TypeError);
        },
    );
});

describe("api – successful responses", () => {
    it("getJSON returns the parsed body", async () => {
        respondWith("get", () => HttpResponse.json([{ id: 1 }]));

        await expect(getJSON("/clients")).resolves.toEqual([{ id: 1 }]);
    });

    it("getJSON passes the abort signal to fetch", async () => {
        const controller = new AbortController();
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json([]));

        await getJSON("/clients", { signal: controller.signal });

        expect(fetchSpy).toHaveBeenCalledWith(apiUrl("/clients"), expect.objectContaining({ signal: controller.signal, credentials: "include" }));
        fetchSpy.mockRestore();
    });

    it("postJSON sends the data as JSON and returns the parsed body", async () => {
        let received;
        server.use(http.post(apiUrl("/clients"), async ({ request }) => {
            received = { contentType: request.headers.get("Content-Type"), body: await request.json() };
            return HttpResponse.json({ id: 9 }, { status: 201 });
        }));

        await expect(postJSON("/clients", { firstName: "Jana" })).resolves.toEqual({ id: 9 });
        expect(received).toEqual({ contentType: "application/json", body: { firstName: "Jana" } });
    });

    // every POST endpoint answers with a JSON body, so postJSON has no special case for an empty one
    it("postJSON rejects an empty 2xx body", async () => {
        respondWith("post", () => new HttpResponse(null, { status: 200 }));

        await expect(postJSON("/clients", {})).rejects.toThrow(SyntaxError);
    });

    it("putJSON sends the data as JSON and returns the parsed body", async () => {
        let body;
        server.use(http.put(apiUrl("/clients"), async ({ request }) => {
            body = await request.json();
            return HttpResponse.json({ id: 9, firstName: "Eva" });
        }));

        await expect(putJSON("/clients", { firstName: "Eva" })).resolves.toEqual({ id: 9, firstName: "Eva" });
        expect(body).toEqual({ firstName: "Eva" });
    });

    it("fetchImage returns null for 204 No Content, there is no image", async () => {
        respondWith("get", () => new HttpResponse(null, { status: 204 }));

        await expect(fetchImage("/clients")).resolves.toBeNull();
    });

    it("putJSON returns null for 204 No Content", async () => {
        respondWith("put", () => new HttpResponse(null, { status: 204 }));

        await expect(putJSON("/clients", {})).resolves.toBeNull();
    });

    it.each([
        ["deleteJSON", () => deleteJSON("/clients")],
        ["deleteImage", () => deleteImage("/clients")],
    ])("%s returns the raw response, also for 204 No Content", async (_name, send) => {
        respondWith("delete", () => new HttpResponse(null, { status: 204 }));

        const response = await send();

        expect(response.status).toBe(204);
    });

    it("get returns the raw response without throwing on an error status", async () => {
        respondWith("get", () => HttpResponse.json({ message: "Chyba" }, { status: 500 }));

        const response = await get("/clients");

        expect(response.ok).toBe(false);
        await expect(response.json()).resolves.toEqual({ message: "Chyba" });
    });

    it("post sends the data form-encoded, as Spring Security login expects", async () => {
        let received;
        server.use(http.post(apiUrl("/login"), async ({ request }) => {
            received = { contentType: request.headers.get("Content-Type"), body: await request.text() };
            return new HttpResponse(null, { status: 200 });
        }));

        const response = await post("/login", { username: "jana nová", password: "a&b=c" });

        expect(response.ok).toBe(true);
        expect(received.contentType).toBe("application/x-www-form-urlencoded");
        expect(Object.fromEntries(new URLSearchParams(received.body))).toEqual({ username: "jana nová", password: "a&b=c" });
    });

    it("uploadFile sends the file under the field name 'file' and returns the parsed body", async () => {
        // jsdom's FormData cannot be serialized by Node's fetch, so the field is checked where it is built
        const append = vi.spyOn(FormData.prototype, "append");
        respondWith("post", () => HttpResponse.json({ id: 77 }));
        const file = photo();

        await expect(uploadFile("/clients", file)).resolves.toEqual({ id: 77 });
        expect(append).toHaveBeenCalledWith("file", file);
        append.mockRestore();
    });
});

describe("api – fetchImage", () => {
    beforeEach(() => {
        // jsdom has no object URLs
        URL.createObjectURL = vi.fn(() => "blob:http://localhost/qr");
    });

    afterEach(() => {
        delete URL.createObjectURL;
    });

    it("returns an object URL of the downloaded image", async () => {
        respondWith("get", () => new HttpResponse(new Uint8Array([137, 80, 78, 71]), { headers: { "Content-Type": "image/png" } }));

        await expect(fetchImage("/clients")).resolves.toBe("blob:http://localhost/qr");
        const blob = URL.createObjectURL.mock.calls[0][0];
        expect(blob.size).toBe(4);
        expect(blob.type).toBe("image/png");
    });

    it("throws with the status and ignores the body on an error", async () => {
        respondWith("get", () => HttpResponse.json({ message: "Klient nemá účet" }, { status: 404 }));

        await expect(fetchImage("/clients")).rejects.toThrow(new Error("HTTP error! status: 404"));
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
});

describe("userMessageOf", () => {
    it("says in Czech that the server is unreachable when fetch fails without an answer", () => {
        expect(userMessageOf(new TypeError("Failed to fetch"))).toBe("Server není dostupný");
    });

    it("keeps the server's own message", () => {
        expect(userMessageOf(new Error("Neplatné přihlašovací údaje"))).toBe("Neplatné přihlašovací údaje");
    });

    it.each([new Error(""), undefined])("falls back without a message (%j)", (error) => {
        expect(userMessageOf(error)).toBe("Server není dostupný");
    });
});
