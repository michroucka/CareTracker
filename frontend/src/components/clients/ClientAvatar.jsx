import { IconUser } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function initials(client) {
    return `${client.firstName?.[0] ?? ""}${client.lastName?.[0] ?? ""}`.toUpperCase();
}

/** Client photo, or initials on lavender when there is none. Size comes from `className` (default size-9). */
export function ClientAvatar({ client, src = client.pictureUrl, className }) {
    const fallback = initials(client) || <IconUser className="size-1/2" />;
    return (
        <span className={cn("grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground", className)}>
            {src ? <img src={src} alt="" className="size-full object-cover" /> : fallback}
        </span>
    );
}
