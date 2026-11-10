import React, { useRef } from "react";
import { IconCheck, IconSelector, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { removeDiacritics } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const SEARCH_THRESHOLD = 6;

function filterOptions(value, search, keywords = []) {
    return removeDiacritics(keywords.join(" ")).includes(removeDiacritics(search.trim())) ? 1 : 0;
}

/**
 * Searchable multi select for forms. `value` is an array of option values; the popover stays open
 * while toggling. One selected option shows its label in the trigger; more show `formatCount(count)`
 * ("3 pečovatelé") and are listed under the field as removable chips, so long names never widen the form.
 * Extra props (id, aria-*) go to the trigger, so it works with FormField's controlProps.
 */
export function MultiCombobox({ options, value, onChange, formatCount = (count) => `${count} vybráno`, placeholder = "Vyberte…", searchPlaceholder = "Hledat…", emptyText = "Nic nenalezeno.", disabled, className, ...triggerProps }) {
    const commandRef = useRef(null);
    const hasSearch = options.length > SEARCH_THRESHOLD;
    const selected = options.filter((option) => value.includes(option.value));

    const toggle = (optionValue) => {
        onChange(value.includes(optionValue) ? value.filter((existing) => existing !== optionValue) : [...value, optionValue]);
    };

    const summary = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0].label : formatCount(selected.length);

    return (
        <div className="grid min-w-0 gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        {...triggerProps}
                        type="button"
                        variant="outline"
                        role="combobox"
                        disabled={disabled}
                        className={cn("w-full min-w-0 justify-between bg-card px-3 text-base font-normal active:scale-100", selected.length === 0 && "text-muted-foreground", className)}
                    >
                        <span className="truncate">{summary}</span>
                        <IconSelector className="text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="flex max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) flex-col p-0" align="start" onOpenAutoFocus={(event) => {
                    // a short list has no search field; Radix would focus the popover, which is outside
                    // the command root that handles the arrow keys and Enter
                    if (hasSearch) return;
                    event.preventDefault();
                    commandRef.current?.focus();
                }}>
                    <Command ref={commandRef} tabIndex={-1} filter={filterOptions} className="outline-none">
                        {hasSearch && <CommandInput placeholder={searchPlaceholder} />}
                        <CommandList>
                            <CommandEmpty>{emptyText}</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem key={option.value} value={String(option.value)} keywords={[option.label]} onSelect={() => toggle(option.value)}>
                                        <IconCheck className={cn("size-4", value.includes(option.value) ? "opacity-100" : "opacity-0")} />
                                        <span className="truncate">{option.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selected.length > 1 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Vybráno">
                    {selected.map((option) => (
                        <li key={option.value} className="inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-sm text-secondary-foreground">
                            <span className="truncate">{option.label}</span>
                            <button
                                type="button"
                                onClick={() => toggle(option.value)}
                                disabled={disabled}
                                aria-label={`Odebrat ${option.label}`}
                                className="grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-fast ease-out hover:bg-secondary-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                                <IconX className="size-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
