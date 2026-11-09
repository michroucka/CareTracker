import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { apiUrl, server } from "@/test/server";
import { toast } from "@/components/ui/sonner";
import { DELETE_PICTURE, pictureUrl, savePicture, shrinkPhoto } from "./pictures";

vi.mock("@/components/ui/sonner", () => ({ toast: { warning: vi.fn() } }));

const MB = 1024 * 1024;

function imageFile({ type = "image/jpeg", size } = {}) {
    const file = new File(["pixels"], "photo.heic", { type });
    if (size !== undefined) Object.defineProperty(file, "size", { value: size });
    return file;
}

function fakeBitmap(width, height) {
    return { width, height, close: vi.fn() };
}

/** Replaces the browser imaging APIs jsdom lacks and records what was drawn. */
function mockImaging({ bitmap = fakeBitmap(800, 600), blob = new Blob(["jpeg"], { type: "image/jpeg" }) } = {}) {
    const context = { fillStyle: null, fillRect: vi.fn(), drawImage: vi.fn() };
    const createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal("createImageBitmap", createImageBitmap);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(blob));
    return { context, createImageBitmap, toBlob, bitmap };
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("pictureUrl", () => {
    it("returns null without a picture", () => {
        expect(pictureUrl("clients", 7, null)).toBeNull();
    });

    it("defaults to the thumbnail and carries the picture id as a cache buster", () => {
        expect(pictureUrl("clients", 7, 42)).toBe(apiUrl("/clients/7/picture?size=thumb&v=42"));
    });

    it("asks for the full size for the detail", () => {
        expect(pictureUrl("employees", 3, 9, "full")).toBe(apiUrl("/employees/3/picture?size=full&v=9"));
    });
});

describe("shrinkPhoto", () => {
    it("rejects a file that is not an image", async () => {
        await expect(shrinkPhoto(new File(["%PDF"], "doc.pdf", { type: "application/pdf" }))).rejects.toThrow("Vyberte prosím obrázek");
    });

    it("rejects a source over 50 MB before decoding it", async () => {
        const { createImageBitmap } = mockImaging();

        await expect(shrinkPhoto(imageFile({ size: 50 * MB + 1 }))).rejects.toThrow("Maximum je 50 MB");
        expect(createImageBitmap).not.toHaveBeenCalled();
    });

    it("accepts a source of exactly 50 MB", async () => {
        mockImaging();

        await expect(shrinkPhoto(imageFile({ size: 50 * MB }))).resolves.toBeInstanceOf(File);
    });

    it("explains a format the browser cannot open (e.g. HEIC in Chrome)", async () => {
        vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new DOMException("bad", "InvalidStateError")));

        await expect(shrinkPhoto(imageFile({ type: "image/heic" }))).rejects.toThrow("Tento formát fotky prohlížeč neumí otevřít");
    });

    it("respects the EXIF orientation when decoding", async () => {
        const { createImageBitmap } = mockImaging();
        const file = imageFile();

        await shrinkPhoto(file);

        expect(createImageBitmap).toHaveBeenCalledWith(file, { imageOrientation: "from-image" });
    });

    it.each([
        ["landscape", 4000, 3000, 1600, 1200],
        ["portrait", 3000, 4000, 1200, 1600],
        ["odd size rounded", 4001, 2999, 1600, 1199],
    ])("shrinks a large %s photo so the longest edge is 1600 px", async (_label, width, height, expectedWidth, expectedHeight) => {
        const { context, bitmap } = mockImaging({ bitmap: fakeBitmap(width, height) });

        await shrinkPhoto(imageFile());

        expect(context.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, expectedWidth, expectedHeight);
    });

    it("never enlarges a small photo", async () => {
        const { context, bitmap } = mockImaging({ bitmap: fakeBitmap(800, 600) });

        await shrinkPhoto(imageFile());

        expect(context.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 800, 600);
    });

    it("paints a white background so transparency does not turn black in JPEG", async () => {
        const { context } = mockImaging({ bitmap: fakeBitmap(800, 600) });

        await shrinkPhoto(imageFile({ type: "image/png" }));

        expect(context.fillStyle).toBe("#ffffff");
        expect(context.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
        expect(context.fillRect.mock.invocationCallOrder[0]).toBeLessThan(context.drawImage.mock.invocationCallOrder[0]);
    });

    it("releases the decoded bitmap", async () => {
        const { bitmap } = mockImaging();

        await shrinkPhoto(imageFile());

        expect(bitmap.close).toHaveBeenCalled();
    });

    it("returns a JPEG file encoded at quality 0.85", async () => {
        const { toBlob } = mockImaging();

        const result = await shrinkPhoto(imageFile({ type: "image/png" }));

        expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.85);
        expect(result).toBeInstanceOf(File);
        expect(result.name).toBe("photo.jpg");
        expect(result.type).toBe("image/jpeg");
    });

    it("fails with a message when the canvas cannot encode the photo", async () => {
        mockImaging({ blob: null });

        await expect(shrinkPhoto(imageFile())).rejects.toThrow("Fotku se nepodařilo zpracovat.");
    });
});

describe("savePicture", () => {
    beforeEach(() => {
        vi.mocked(toast.warning).mockClear();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("uploads a new File and returns the new picture id", async () => {
        server.use(http.post(apiUrl("/clients/5/picture"), () => HttpResponse.json({ id: 77 })));

        const pictureId = await savePicture("clients", 5, new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }), 12);

        expect(pictureId).toBe(77);
        expect(toast.warning).not.toHaveBeenCalled();
    });

    it("deletes the stored photo on DELETE_PICTURE and returns null", async () => {
        const deleted = vi.fn();
        server.use(http.delete(apiUrl("/employees/5/picture"), () => {
            deleted();
            return new HttpResponse(null, { status: 204 });
        }));

        await expect(savePicture("employees", 5, DELETE_PICTURE, 12)).resolves.toBeNull();
        expect(deleted).toHaveBeenCalledOnce();
    });

    it.each([
        ["the current URL", "http://localhost/clients/5/picture?v=12"],
        ["null", null],
    ])("keeps the current picture for %s without any request", async (_label, picture) => {
        await expect(savePicture("clients", 5, picture, 12)).resolves.toBe(12);
    });

    it("only warns when the upload fails, because the owner is saved already", async () => {
        server.use(http.post(apiUrl("/clients/5/picture"), () => HttpResponse.json({ message: "Soubor je příliš velký" }, { status: 413 })));

        const pictureId = await savePicture("clients", 5, new File(["jpeg"], "photo.jpg"), 12);

        expect(pictureId).toBe(12);
        expect(toast.warning).toHaveBeenCalledWith("Údaje jsou uložené, ale fotka ne", { description: "Soubor je příliš velký" });
    });

    it("only warns when the delete fails and keeps the current id", async () => {
        server.use(http.delete(apiUrl("/clients/5/picture"), () => HttpResponse.json({ message: "Nelze smazat" }, { status: 500 })));

        await expect(savePicture("clients", 5, DELETE_PICTURE, 12)).resolves.toBe(12);
        expect(toast.warning).toHaveBeenCalledWith("Údaje jsou uložené, ale fotka ne", { description: "Nelze smazat" });
    });
});
