import React from "react";
import { IconCalendar } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fromIsoDate, toIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const displayFormatter = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

/**
 * Date field with a calendar popover (shadcn calendar on react-day-picker, Czech locale).
 * `value` and `onChange` use ISO dates ("2026-11-08") as the backend does. `minDate` / `maxDate` are ISO too.
 * Extra props (id, aria-*) go to the trigger, so it works with FormField's controlProps.
 */
export function DatePicker({ value, onChange, minDate, maxDate, placeholder = "Vyberte datum", disabled, className, ...triggerProps }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const contentRef = React.useRef(null);
    const selected = fromIsoDate(value);
    const min = fromIsoDate(minDate);
    const max = fromIsoDate(maxDate);

    const disabledDays = [min && { before: min }, max && { after: max }].filter(Boolean);

    // like DayFilter: start on the selected day, not on the month navigation several Tabs away
    const focusSelectedDay = (event) => {
        const selectedDay = contentRef.current?.querySelector("button[data-selected-single='true']");
        if (!selectedDay) return;
        event.preventDefault();
        selectedDay.focus();
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    {...triggerProps}
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn("w-full justify-between bg-card px-3 text-base font-normal tabular-nums active:scale-100", !selected && "text-muted-foreground", className)}
                >
                    {selected ? displayFormatter.format(selected) : placeholder}
                    <IconCalendar className="text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent ref={contentRef} className="w-auto p-0" align="start" onOpenAutoFocus={focusSelectedDay}>
                <Calendar
                    mode="single"
                    selected={selected}
                    defaultMonth={selected ?? max}
                    captionLayout="dropdown"
                    startMonth={min ?? new Date(1920, 0)}
                    endMonth={max ?? new Date(new Date().getFullYear() + 2, 11)}
                    disabled={disabledDays}
                    onSelect={(date) => {
                        if (!date) return;
                        onChange(toIsoDate(date));
                        setIsOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
