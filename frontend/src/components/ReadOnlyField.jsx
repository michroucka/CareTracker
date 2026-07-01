import {formatNumber} from "../utils/formatters.js";
import {Label} from "@heroui/react";

export function ReadOnlyField({ label, value, className = "", multiline = false, type = "string", endContent = null, isDisabled = false }) {
    if (type === "number") {
        value = formatNumber(value);
    }

    const containerCls = `flex flex-col w-full ${isDisabled ? "opacity-50" : ""} ${className}`;

    return (
        <div className={`${containerCls} gap-1`}>
            {label && <Label>{label}</Label>}
            <div className={`w-full rounded-xl bg-field px-3 py-2 text-foreground ${multiline ? "min-h-[38px]" : ""}`}>
                {value || "-"} {endContent}
            </div>
        </div>
    );
}
