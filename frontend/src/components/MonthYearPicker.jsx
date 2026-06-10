import React, { useState } from "react";
import {
    Button,
    Popover,
    Select,
    Label,
    ListBox
} from "@heroui/react";
import { CalendarDays } from "lucide-react";
import {MIN_YEAR, MONTHS_SHORT} from "../constants/globalConstants.js";

export default function MonthYearPicker({ className = "", onChange, defaultValue, isDisabled = false }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedMonth, setSelectedMonth] = useState(defaultValue?.month ?? currentMonth);
    const [selectedYear, setSelectedYear] = useState(defaultValue?.year ?? currentYear);
    const [isOpen, setIsOpen] = useState(false);

    const years = Array.from({ length: currentYear - MIN_YEAR + 1 }, (_, i) => currentYear - i);

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
            <Button
                variant="tertiary"
                className={`justify-between ${className}`}
                isDisabled={isDisabled}
            >{MONTHS_SHORT[selectedMonth]} {selectedYear} <CalendarDays className="size-4 ms-2" /></Button>
            <Popover.Content placement="bottom" className="p-3 w-[175px]">
                <Popover.Dialog>
                <div className="flex flex-col gap-4 w-full">
                    <Select
                        value={selectedYear.toString()}
                        onChange={(value) => {
                            const year = Number(value);
                            const month = year === currentYear && selectedMonth > currentMonth
                                ? currentMonth
                                : selectedMonth;
                            setSelectedYear(year);
                            setSelectedMonth(month);
                            onChange?.({ month, year });
                        }}
                    >
                        <Label>Rok</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                {years.map((y) => (
                                    <ListBox.Item key={y} id={y.toString()} textValue={y.toString()}>
                                        {y}
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    <div className="grid grid-cols-3 gap-2">
                        {MONTHS_SHORT.map((month, index) => (
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
                </Popover.Dialog>
            </Popover.Content>
        </Popover>
    );
};