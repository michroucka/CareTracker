import React from "react";
import { IconClock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { padTime, parseTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

function TimeButton({ selected, onClick, children }) {
    return (
        <Button
            type="button"
            size="sm"
            variant={selected ? "default" : "ghost"}
            aria-pressed={selected}
            onClick={onClick}
            className="h-8 px-0 tabular-nums active:scale-100"
        >
            {children}
        </Button>
    );
}

/**
 * 24-hour time field ("HH:mm"): type it ("1430", "9.15", "9") or pick hour and minute from the popover.
 * Typing reports every complete valid time right away, so submitting with Enter never sees a stale value;
 * leaving the field normalizes the text or restores the last valid time.
 * Extra props (id, aria-*) go to the input, so it works with FormField's controlProps.
 */
export function TimePicker({ value, onChange, disabled, className, ...inputProps }) {
    const [text, setText] = React.useState(value ?? "");
    const [isOpen, setIsOpen] = React.useState(false);
    const gridRef = React.useRef(null);
    const [hour, minute] = (value ?? "").split(":").map(Number);

    React.useEffect(() => {
        setText(value ?? "");
    }, [value]);

    const type = (event) => {
        const nextText = event.target.value.replace(/[^\d:.,]/g, "").slice(0, 5);
        setText(nextText);
        const parsed = /^\d{1,2}[:.,]\d{2}$|^\d{3,4}$/.test(nextText) ? parseTime(nextText) : null;
        if (parsed && parsed !== value) onChange(parsed);
    };

    const normalize = () => {
        const parsed = parseTime(text);
        if (parsed) {
            setText(parsed);
            if (parsed !== value) onChange(parsed);
        } else {
            setText(value ?? "");
        }
    };

    const pickHour = (nextHour) => onChange(`${padTime(nextHour)}:${padTime(Number.isNaN(minute) ? 0 : minute)}`);
    const pickMinute = (nextMinute) => {
        onChange(`${padTime(Number.isNaN(hour) ? 0 : hour)}:${padTime(nextMinute)}`);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)}>
            <Input
                {...inputProps}
                value={text}
                onChange={type}
                onBlur={normalize}
                inputMode="numeric"
                placeholder="hh:mm"
                autoComplete="off"
                disabled={disabled}
                className="pr-11 tabular-nums"
            />
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-row"
                        disabled={disabled}
                        aria-label="Vybrat čas"
                        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <IconClock />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    ref={gridRef}
                    className="w-72 p-3"
                    align="end"
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        gridRef.current?.querySelector("[aria-pressed='true']")?.focus();
                    }}
                >
                    <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Hodina</p>
                    <div className="grid grid-cols-6 gap-1">
                        {HOURS.map((option) => (
                            <TimeButton key={option} selected={option === hour} onClick={() => pickHour(option)}>{option}</TimeButton>
                        ))}
                    </div>
                    <p className="mt-3 mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Minuta</p>
                    <div className="grid grid-cols-6 gap-1">
                        {MINUTES.map((option) => (
                            <TimeButton key={option} selected={option === minute} onClick={() => pickMinute(option)}>{padTime(option)}</TimeButton>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
