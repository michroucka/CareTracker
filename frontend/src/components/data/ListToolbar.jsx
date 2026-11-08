import { IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
    { key: "true", label: "Aktivní" },
    { key: "false", label: "Neaktivní" },
];

function statusLabel(statusFilter) {
    if (statusFilter.size === 2) return "Všechny";
    return statusFilter.has("true") ? "Aktivní" : "Neaktivní";
}

/**
 * Status filter as a Set of "true"/"false" keys; at least one of them stays selected.
 */
function StatusFilter({ value, onChange }) {
    const toggle = (key, checked) => {
        const next = new Set(value);
        if (checked) next.add(key);
        else next.delete(key);
        if (next.size > 0) onChange(next);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <span className="text-muted-foreground">Stav:</span> {statusLabel(value)}
                    <IconChevronDown className="text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.key}
                        checked={value.has(option.key)}
                        onCheckedChange={(checked) => toggle(option.key, checked)}
                        onSelect={(event) => event.preventDefault()}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Search + status filter row above a list, with the total count underneath.
 */
export function ListToolbar({ search, onSearchChange, searchPlaceholder, statusFilter, onStatusFilterChange, countLabel, children }) {
    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1 basis-60 sm:max-w-sm">
                    <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        className="pr-10 pl-9"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            aria-label="Vymazat hledání"
                            className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground transition-colors duration-base ease-out hover:text-foreground"
                        >
                            <IconX className="size-4" />
                        </button>
                    )}
                </div>
                {statusFilter && <StatusFilter value={statusFilter} onChange={onStatusFilterChange} />}
                {children}
            </div>
            {countLabel && <p className="text-sm text-muted-foreground">{countLabel}</p>}
        </div>
    );
}
