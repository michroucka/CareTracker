import React, { useState } from "react";
import {
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Select,
    SelectItem
} from "@heroui/react";
import { CalendarDays } from "lucide-react";
import {minYear} from "../constants/globalConstants.js";

const months = [
    "Led", "Úno", "Bře", "Dub", "Kvě", "Čer",
    "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"
];

export default function MonthYearPicker({ className = "", onChange, defaultValue }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedMonth, setSelectedMonth] = useState(defaultValue?.month ?? currentMonth);
    const [selectedYear, setSelectedYear] = useState(defaultValue?.year ?? currentYear);
    const [isOpen, setIsOpen] = useState(false);

    const years = Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom">
            <PopoverTrigger>
                <Button
                    variant="flat"
                    endContent={<CalendarDays className="size-4 ms-2" />}
                    className={`justify-between ${className}`}
                >
                    {months[selectedMonth]} {selectedYear}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3 w-[175px]">
                <div className="flex flex-col gap-4 w-full">
                    <Select
                        label="Rok"
                        size="sm"
                        selectedKeys={[selectedYear.toString()]}
                        onChange={(e) => {
                            const year = Number(e.target.value);
                            setSelectedYear(year);
                            onChange?.({ month: selectedMonth, year });
                        }}
                        disallowEmptySelection
                    >
                        {years.map((y) => (
                            <SelectItem key={y} textValue={y.toString()}>{y}</SelectItem>
                        ))}
                    </Select>

                    <div className="grid grid-cols-3 gap-2">
                        {months.map((month, index) => (
                            <Button
                                key={month}
                                size="sm"
                                variant={selectedMonth === index ? "solid" : "light"}
                                color={selectedMonth === index ? "primary" : "default"}
                                isDisabled={selectedYear === currentYear && index > currentMonth}
                                onPress={() => {
                                    setSelectedMonth(index);
                                    setIsOpen(false);
                                    onChange?.({ month: index, year: selectedYear });
                                }}
                                className="min-w-0 px-0"
                            >
                                {month}
                            </Button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};