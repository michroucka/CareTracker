import React from "react";
import { IconCamera, IconLoader2, IconTrash } from "@tabler/icons-react";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { DELETE_PICTURE, shrinkPhoto } from "@/lib/pictures";
import { cn } from "@/lib/utils";

/**
 * Profile photo picker for clients and employees: click or drop an image onto the avatar, remove it
 * with the button next to it. The photo is shrunk in the browser first, so any phone photo works.
 * `hasSavedPicture` decides whether removing has to delete a photo on the server; `heading` (e.g. the name)
 * is shown above the buttons.
 */
export function PhotoInput({ id, value, onChange, name, hasSavedPicture, heading, disabled }) {
    const inputRef = React.useRef(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);
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

    const pick = async (file) => {
        if (!file) return;
        setIsProcessing(true);
        try {
            onChange(await shrinkPhoto(file));
        } catch (error) {
            toast.error("Fotku nejde použít", { description: error.message });
        } finally {
            setIsProcessing(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const remove = () => onChange(hasSavedPicture ? DELETE_PICTURE : null);

    const onDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!disabled) pick(event.dataTransfer.files?.[0]);
    };

    const isBlocked = disabled || isProcessing;

    return (
        <div className="flex items-center gap-4">
            <input ref={inputRef} id={id} type="file" accept="image/*" className="sr-only" disabled={isBlocked} onChange={(event) => pick(event.target.files?.[0])} />
            <button
                type="button"
                disabled={isBlocked}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                aria-label={preview ? "Změnit fotografii" : "Nahrát fotografii"}
                className={cn(
                    "group relative rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                    isDragging && "ring-[3px] ring-ring/50"
                )}
            >
                <PersonAvatar name={name} src={preview} className="size-20 font-display text-2xl" />
                <span className={cn(
                    "absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white transition-opacity duration-fast ease-out",
                    isProcessing ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                )}>
                    {isProcessing ? <IconLoader2 className="size-6 animate-spin" /> : <IconCamera className="size-6" />}
                </span>
            </button>
            <div className="grid min-w-0 gap-1">
                {heading}
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={isBlocked} onClick={() => inputRef.current?.click()}>
                        <IconCamera /> {preview ? "Změnit fotografii" : "Nahrát fotografii"}
                    </Button>
                    {preview && (
                        <Button type="button" variant="ghost" size="sm" disabled={isBlocked} onClick={remove}>
                            <IconTrash /> Odebrat
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
