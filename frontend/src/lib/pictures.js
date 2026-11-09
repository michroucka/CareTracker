import { deleteImage, uploadFile } from "@/api/api";
import { toast } from "@/components/ui/sonner";

const API_URL = import.meta.env.VITE_API_URL;

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;
// anything bigger is almost certainly not a photo; the browser would spend ages decoding it
const MAX_SOURCE_SIZE_MB = 50;

/**
 * URL of a profile picture for an <img> (the session cookie goes with it). `pictureId` changes with
 * every upload, so the browser may cache the image for good. Returns null without a picture.
 * `owner` is "clients" or "employees"; `size` is "thumb" (lists, avatars) or "full" (detail).
 */
export function pictureUrl(owner, ownerId, pictureId, size = "thumb") {
    if (!pictureId) return null;
    return `${API_URL}/${owner}/${ownerId}/picture?size=${size}&v=${pictureId}`;
}

/**
 * Shrinks a photo in the browser before upload (longest edge 1600 px, JPEG), so a phone photo of any
 * size uploads quickly and fits the server limit. The server resizes again and never trusts this step.
 * Throws an Error with a user-facing message when the browser cannot read the file (e.g. HEIC in Chrome).
 */
export async function shrinkPhoto(file) {
    if (!file.type.startsWith("image/")) throw new Error("Vyberte prosím obrázek (JPG, PNG, GIF nebo WebP).");
    if (file.size > MAX_SOURCE_SIZE_MB * 1024 * 1024) throw new Error(`Soubor je příliš velký. Maximum je ${MAX_SOURCE_SIZE_MB} MB.`);

    let bitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        throw new Error("Tento formát fotky prohlížeč neumí otevřít. Uložte ji prosím jako JPG a zkuste to znovu.");
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    // JPEG has no transparency; without a background transparent areas would turn black
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("Fotku se nepodařilo zpracovat.");
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

/** Form value asking the save to delete the stored photo (the value is otherwise a File, the current URL or null). */
export const DELETE_PICTURE = "DELETE";

/**
 * Applies a photo form value after its owner was saved: a File is uploaded, DELETE_PICTURE removes
 * the stored photo, anything else keeps it. Returns the resulting picture id. A failed photo step only
 * warns, because the owner's data are saved already.
 */
export async function savePicture(owner, ownerId, picture, currentPictureId) {
    try {
        if (picture === DELETE_PICTURE) {
            await deleteImage(`/${owner}/${ownerId}/picture`);
            return null;
        }
        if (picture instanceof File) {
            return (await uploadFile(`/${owner}/${ownerId}/picture`, picture)).id;
        }
    } catch (error) {
        console.error("Error saving picture:", error);
        toast.warning("Údaje jsou uložené, ale fotka ne", { description: error.message });
    }
    return currentPictureId;
}
