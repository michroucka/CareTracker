import React from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MIN_YEAR, MONTHS, MONTHS_SHORT } from "@/constants/globalConstants";
import { cn } from "@/lib/utils";

const toIndex = ({ month, year }) => year * 12 + month;
const fromIndex = (index) => ({ month: index % 12, year: Math.floor(index / 12) });

/**
 * Month picker with previous/next arrows around a popover of months. `value` is `{ month, year }`
 * with a 0-based month; future months are not selectable.
 */
export default function MonthYearPicker({ value, onChange, isDisabled = false, className }) {
    const today = new Date();
    const latest = toIndex({ month: today.getMonth(), year: today.getFullYear() });
    const earliest = toIndex({ month: 0, year: MIN_YEAR });
    const current = toIndex(value);

    const [isOpen, setIsOpen] = React.useState(false);
    const [shownYear, setShownYear] = React.useState(value.year);
    const monthGridRef = React.useRef(null);

    const focusSelectedMonth = (event) => {
        event.preventDefault();
        monthGridRef.current?.querySelector("[aria-pressed='true']")?.focus();
    };

    const select = (index) => {
        onChange(fromIndex(Math.min(Math.max(index, earliest), latest)));
        setIsOpen(false);
    };

    const openChange = (open) => {
        if (open) setShownYear(value.year);
        setIsOpen(open);
    };

    const segmentClass = "h-full rounded-none focus-visible:ring-inset active:scale-100";
    const arrowClass = cn(segmentClass, "w-8 text-muted-foreground hover:text-foreground");

    return (
        <div className={cn("inline-flex h-10 items-stretch overflow-hidden rounded-md border bg-card shadow-xs dark:bg-input/30", isDisabled && "opacity-50", className)}>
            <Button variant="ghost" aria-label="Předchozí měsíc" disabled={isDisabled || current <= earliest} onClick={() => select(current - 1)} className={arrowClass}>
                <IconChevronLeft />
            </Button>
            <Popover open={isOpen} onOpenChange={openChange}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" disabled={isDisabled} className={cn(segmentClass, "min-w-32 flex-1 border-x px-2 tabular-nums")}>
                        {MONTHS[value.month]} {value.year}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="center" onOpenAutoFocus={focusSelectedMonth}>
                    <div className="mb-2 flex items-center justify-between">
                        <Button variant="ghost" size="icon-sm" aria-label="Předchozí rok" disabled={shownYear <= MIN_YEAR} onClick={() => setShownYear(shownYear - 1)}>
                            <IconChevronLeft />
                        </Button>
                        <span className="font-medium tabular-nums">{shownYear}</span>
                        <Button variant="ghost" size="icon-sm" aria-label="Další rok" disabled={shownYear >= today.getFullYear()} onClick={() => setShownYear(shownYear + 1)}>
                            <IconChevronRight />
                        </Button>
                    </div>
                    <div ref={monthGridRef} className="grid grid-cols-3 gap-1">
                        {MONTHS_SHORT.map((label, month) => {
                            const index = toIndex({ month, year: shownYear });
                            return (
                                <Button
                                    key={label}
                                    size="sm"
                                    variant={index === current ? "default" : "ghost"}
                                    disabled={index > latest}
                                    aria-label={`${MONTHS[month]} ${shownYear}`}
                                    aria-pressed={index === current}
                                    onClick={() => select(index)}
                                >
                                    {label}
                                </Button>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
            <Button variant="ghost" aria-label="Další měsíc" disabled={isDisabled || current >= latest} onClick={() => select(current + 1)} className={arrowClass}>
                <IconChevronRight />
            </Button>
        </div>
    );
}
