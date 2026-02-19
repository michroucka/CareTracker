import { useState } from "react";
import { Button, Popover, PopoverTrigger, PopoverContent, Select, SelectItem } from "@heroui/react";
import { ChevronDown } from "lucide-react";

const months = ["Leden","Únor","Březen","Duben","Květen","Červen",
    "Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
const currentYear = new Date().getFullYear();
const years = [currentYear];
const minYear = 1900;

while (years[years.length - 1] >= minYear) years.push(years[years.length - 1] - 1);

export default function MonthYearPicker({ onChange }) {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(currentYear);

    const handleConfirm = () => {
        onChange({ month, year });
    };

    return (
        <Popover>
            <PopoverTrigger>
                <Button variant="flat" endContent={<ChevronDown className="size-4" />}>{months[month]} {year}</Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 flex flex-col gap-3 w-[200px]">
                <Select
                    label="Měsíc"
                    disallowEmptySelection
                    selectedKeys={new Set([String(month)])}
                    onSelectionChange={(keys) => setMonth(Number([...keys][0]))}
                >
                    {months.map((m, i) => (
                        <SelectItem key={String(i)}>{m}</SelectItem>
                    ))}
                </Select>
                <Select
                    label="Rok"
                    disallowEmptySelection
                    selectedKeys={new Set([String(year)])}
                    onSelectionChange={(keys) => setYear(Number([...keys][0]))}
                >
                    {years.map((y) => (
                        <SelectItem key={String(y)}>{String(y)}</SelectItem>
                    ))}
                </Select>
                <Button onPress={handleConfirm} color="primary" className="w-full">Potvrdit</Button>
            </PopoverContent>
        </Popover>
    );
}