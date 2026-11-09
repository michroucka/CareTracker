import React from "react";
import { IconCamera, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ClientAvatar } from "./ClientAvatar";

const MAX_SIZE_MB = 5;

/** Value accepted by `useClients`: a File to upload, "DELETE" to remove the photo, or the current URL. */
export const DELETE_PICTURE = "DELETE";

function validationError(file) {
    if (!file.type.startsWith("image/")) return ["Neplatný formát souboru", "Podporované formáty: JPG, PNG, GIF, WebP"];
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return ["Soubor je příliš velký", `Velikost: ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum: ${MAX_SIZE_MB} MB`];
    }
    return null;
}

/**
 * Client photo picker: click or drop an image onto the avatar, remove it with the button next to it.
 * `hasSavedPicture` decides whether removing has to delete a photo on the server.
 */
export function ClientPhotoInput({ id, value, onChange, client, hasSavedPicture, disabled }) {
    const inputRef = React.useRef(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [preview, setPreview] = React.useState(null);

    React.useEffect(() => {
        if (!(value instanceof File)) {
            setPreview(value === DELETE_PICTURE ? null : value);
            return undefined;
        }
        const objectUrl = URL.createObjectURL(value);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [value]);

    const pick = (file) => {
        if (!file) return;
        const error = validationError(file);
        if (error) {
            toast.error(error[0], { description: error[1] });
            return;
        }
        onChange(file);
    };

    const remove = () => {
        onChange(hasSavedPicture ? DELETE_PICTURE : null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const onDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!disabled) pick(event.dataTransfer.files?.[0]);
    };

    return (
        <div className="flex items-center gap-4">
            <input ref={inputRef} id={id} type="file" accept="image/*" className="sr-only" disabled={disabled} onChange={(event) => pick(event.target.files?.[0])} />
            <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                aria-label={preview ? "Změnit fotografii" : "Nahrát fotografii"}
                className={cn(
                    "group relative rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                    isDragging && "ring-[3px] ring-ring/50"
                )}
            >
                <ClientAvatar client={client} src={preview} className="size-20 font-display text-2xl" />
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-fast ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
                    <IconCamera className="size-6" />
                </span>
            </button>
            <div className="grid gap-1">
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
                        <IconCamera /> {preview ? "Změnit fotografii" : "Nahrát fotografii"}
                    </Button>
                    {preview && (
                        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={remove}>
                            <IconTrash /> Odebrat
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">JPG, PNG, GIF nebo WebP do {MAX_SIZE_MB} MB.</p>
            </div>
        </div>
    );
}
