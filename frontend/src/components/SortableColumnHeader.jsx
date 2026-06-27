import { cn } from "@heroui/react";
import { ChevronUp } from "lucide-react";

export function SortableColumnHeader({ children, sortDirection }) {
    return (
        <span className="flex items-center justify-between">
            {children}
            {!!sortDirection && (
                <ChevronUp
                    className={cn(
                        "size-4 transform transition-transform duration-100 ease-out",
                        sortDirection === "descending" ? "rotate-180" : "",
                    )}
                />
            )}
        </span>
    );
}
