import { IconUser } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function initials(name = "") {
    const parts = name.split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts.at(-1)[0] : ""}`.toUpperCase();
}

/**
 * Round photo of a person, or initials of `name` on lavender when there is no `src`.
 * Size comes from `className` (default size-9).
 */
export function PersonAvatar({ name, src, className }) {
    const fallback = initials(name) || <IconUser className="size-1/2" />;
    return (
        <span className={cn("grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary-foreground", className)}>
            {src ? <img src={src} alt="" loading="lazy" className="size-full object-cover" /> : fallback}
        </span>
    );
}
