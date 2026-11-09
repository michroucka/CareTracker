import React from "react";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fromIsoDate, toIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const dayFormatter = new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" });

/**
 * Narrows a month to one day. `days` are the ISO dates that have records (sorted ascending); only those
 * can be picked, and the arrows step between them. `value` is an ISO date or "" for the whole month.
 */
export function DayFilter({ period, days, value, onChange, isDisabled = false }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const contentRef = React.useRef(null);
    const openedByPointer = React.useRef(false);
    const index = days.indexOf(value);
    const available = React.useMemo(() => new Set(days), [days]);

    // The popover focuses the first enabled day, whose focus ring looks like a selection after a click.
    // Keyboard users keep that (they need a focused day for the arrow keys); a click focuses the calendar
    // itself, so Tab still leads into the days. A selected day always gets the focus.
    const focusOnOpen = (event) => {
        const selectedDay = contentRef.current?.querySelector("button[data-selected-single='true']");
        if (selectedDay) {
            event.preventDefault();
            selectedDay.focus();
        } else if (openedByPointer.current) {
            event.preventDefault();
            contentRef.current?.focus();
        }
    };

    const select = (day) => {
        onChange(day);
        setIsOpen(false);
    };

    const segmentClass = "h-full rounded-none focus-visible:ring-inset active:scale-100";
    const arrowClass = cn(segmentClass, "w-8 text-muted-foreground hover:text-foreground");

    return (
        <div className={cn("inline-flex h-10 items-stretch overflow-hidden rounded-md border bg-card shadow-xs dark:bg-input/30", isDisabled && "opacity-50")}>
            {value && (
                <Button variant="ghost" aria-label="Předchozí den se záznamy" disabled={index <= 0} onClick={() => onChange(days[index - 1])} className={cn(arrowClass, "border-r")}>
                    <IconChevronLeft />
                </Button>
            )}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        disabled={isDisabled || days.length === 0}
                        onPointerDown={() => { openedByPointer.current = true; }}
                        onKeyDown={() => { openedByPointer.current = false; }}
                        className={cn(segmentClass, "px-3 font-normal tabular-nums")}
                    >
                        <span className="text-muted-foreground">Den:</span>
                        <span className="font-medium">{value ? dayFormatter.format(fromIsoDate(value)) : "Všechny"}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent ref={contentRef} tabIndex={-1} className="w-auto p-0 outline-none" align="start" onOpenAutoFocus={focusOnOpen}>
                    <Calendar
                        mode="single"
                        month={new Date(period.year, period.month)}
                        hideNavigation
                        showOutsideDays={false}
                        selected={fromIsoDate(value)}
                        disabled={(date) => !available.has(toIsoDate(date))}
                        onSelect={(date) => date && select(toIsoDate(date))}
                    />
                </PopoverContent>
            </Popover>
            {value && (
                <>
                    <Button variant="ghost" aria-label="Další den se záznamy" disabled={index === -1 || index >= days.length - 1} onClick={() => onChange(days[index + 1])} className={cn(arrowClass, "border-l")}>
                        <IconChevronRight />
                    </Button>
                    <Button variant="ghost" aria-label="Zobrazit celý měsíc" onClick={() => onChange("")} className={cn(arrowClass, "border-l")}>
                        <IconX />
                    </Button>
                </>
            )}
        </div>
    );
}
