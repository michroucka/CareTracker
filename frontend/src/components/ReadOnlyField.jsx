import {formatNumber} from "../utils/formatters.js";

export function ReadOnlyField({ label, value, className = "", labelPlacement = "inside", multiline = false, type = "string", endContent = null, isDisabled = false }) {
    if (type === "number") {
        value = formatNumber(value);
    }

    const containerCls = `flex flex-col w-full ${isDisabled ? "opacity-50" : ""} ${className}`;

    if (labelPlacement === "outside") {
        return (
            <div className={containerCls}>
                {label && <label className="text-xs font-medium text-foreground/50 mb-1">{label}</label>}
                <div className={`w-full rounded-md bg-default-100 px-3 text-sm text-foreground ${multiline ? "py-2 min-h-20 whitespace-pre-wrap" : "h-14 flex items-center"}`}>
                    {value || "-"} {endContent}
                </div>
            </div>
        );
    }

    return (
        <div className={containerCls}>
            <div className={`relative w-full rounded-md bg-default-100 px-3 flex flex-col justify-center ${multiline ? "py-2 min-h-20" : "h-14"}`}>
                {label && <label className="text-xs font-medium text-foreground/50">{label}</label>}
                <div className={`text-sm text-foreground ${multiline ? "whitespace-pre-wrap" : ""}`}>
                    {value || "-"} {endContent}
                </div>
            </div>
        </div>
    );
}
