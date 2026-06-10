import { Calendar, DateField, DatePicker, Label, FieldError } from "@heroui/react";
import { CalendarDays } from "lucide-react";

export function AppDatePicker({
    label,
    name,
    value,
    onChange,
    isRequired = false,
    isInvalid = false,
    isDisabled = false,
    errorMessage,
    minValue,
    maxValue,
    placeholderValue,
    hideTimeZone,
    className = "",
}) {
    return (
        <DatePicker
            name={name}
            value={value}
            onChange={onChange}
            isRequired={isRequired}
            isInvalid={isInvalid}
            isDisabled={isDisabled}
            minValue={minValue}
            maxValue={maxValue}
            placeholderValue={placeholderValue}
            hideTimeZone={hideTimeZone}
            className={className}
        >
            <Label>{label}</Label>
            <DateField.Group fullWidth>
                <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} className="text-default-500" />}
                </DateField.Input>
                <DateField.Suffix>
                    <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator>
                            <CalendarDays size={18} />
                        </DatePicker.TriggerIndicator>
                    </DatePicker.Trigger>
                </DateField.Suffix>
            </DateField.Group>
            <DatePicker.Popover>
                <Calendar aria-label={label}>
                    <Calendar.Header>
                        <Calendar.YearPickerTrigger>
                            <Calendar.YearPickerTriggerHeading />
                            <Calendar.YearPickerTriggerIndicator />
                        </Calendar.YearPickerTrigger>
                        <Calendar.NavButton slot="previous" />
                        <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                        <Calendar.GridHeader>
                            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                        </Calendar.GridHeader>
                        <Calendar.GridBody>
                            {(date) => <Calendar.Cell date={date} />}
                        </Calendar.GridBody>
                    </Calendar.Grid>
                    <Calendar.YearPickerGrid>
                        <Calendar.YearPickerGridBody>
                            {({year}) => <Calendar.YearPickerCell year={year} />}
                        </Calendar.YearPickerGridBody>
                    </Calendar.YearPickerGrid>
                </Calendar>
            </DatePicker.Popover>
            <FieldError>{errorMessage}</FieldError>
        </DatePicker>
    );
}
