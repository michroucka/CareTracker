import React from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { removeDiacritics } from "@/utils/formatters";
import { cn } from "@/lib/utils";

function filterOptions(value, search, keywords = []) {
    return removeDiacritics(keywords.join(" ")).includes(removeDiacritics(search.trim())) ? 1 : 0;
}

/**
 * Searchable multi select for forms. `value` is an array of option values; the popover stays open
 * while toggling. Extra props (id, aria-*) go to the trigger, so it works with FormField's controlProps.
 */
export function MultiCombobox({ options, value, onChange, placeholder = "Vyberte…", searchPlaceholder = "Hledat…", emptyText = "Nic nenalezeno.", disabled, className, ...triggerProps }) {
    const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);

    const toggle = (optionValue) => {
        onChange(value.includes(optionValue) ? value.filter((existing) => existing !== optionValue) : [...value, optionValue]);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    {...triggerProps}
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={disabled}
                    className={cn("w-full justify-between bg-card px-3 text-base font-normal active:scale-100", selectedLabels.length === 0 && "text-muted-foreground", className)}
                >
                    <span className="truncate">{selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}</span>
                    <IconSelector className="text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command filter={filterOptions}>
                    {options.length > 6 && <CommandInput placeholder={searchPlaceholder} />}
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
    );
}
