import React from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { removeDiacritics } from "@/utils/formatters";
import { cn } from "@/lib/utils";

function filterOptions(value, search, keywords = []) {
    return removeDiacritics(keywords.join(" ")).includes(removeDiacritics(search.trim())) ? 1 : 0;
}

/**
 * Filter button with a searchable checkbox list. `selected` is a Set of option values as strings;
 * an empty Set means "all".
 */
export function MultiSelectFilter({ label, allLabel, options, selected, onChange, searchPlaceholder = "Hledat…" }) {
    const toggle = (value) => {
        const next = new Set(selected);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        onChange(next);
    };

    const summary = selected.size === 0
        ? allLabel
        : selected.size === 1
            ? options.find((option) => String(option.value) === [...selected][0])?.label ?? allLabel
            : `${selected.size} vybrané`;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="max-w-full">
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="truncate">{summary}</span>
                    <IconChevronDown className="text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
                <Command filter={filterOptions}>
                    {options.length > 6 && <CommandInput placeholder={searchPlaceholder} />}
                    <CommandList>
                        <CommandEmpty>Nic nenalezeno.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem value="__all__" keywords={[allLabel]} onSelect={() => onChange(new Set())}>
                                <IconCheck className={cn("size-4", selected.size === 0 ? "opacity-100" : "opacity-0")} />
                                {allLabel}
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            {options.map((option) => {
                                const value = String(option.value);
                                return (
                                    <CommandItem key={value} value={value} keywords={[option.label]} onSelect={() => toggle(value)}>
                                        <IconCheck className={cn("size-4", selected.has(value) ? "opacity-100" : "opacity-0")} />
                                        <span className="truncate">{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
