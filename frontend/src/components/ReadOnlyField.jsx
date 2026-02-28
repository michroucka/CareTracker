import {formatNumber} from "../utils/formatters.js";

export function ReadOnlyField({ label, value, className = "", labelPlacement = "inside", multiline = false, type = "string", endContent = null, isDisabled = false }) {
    if (type === "number") {
        value = formatNumber(value)
    }

    if (labelPlacement === "outside") {
        return (
            <div className={`group flex flex-col w-full -mt-0.5 ${isDisabled ? 'opacity-50' : ''} ${className}`} data-slot="base" data-has-label="true" data-has-value="true">
                {label ? (
                    <label
                        data-slot="label"
                        className="z-10 pointer-events-none origin-top-left shrink-0 rtl:origin-top-right subpixel-antialiased block text-small text-foreground relative will-change-auto !duration-200 !ease-out motion-reduce:transition-none transition-[transform,color,left,opacity,translate,scale] group-data-[filled-within=true]:text-foreground group-data-[filled-within=true]:pointer-events-auto pb-2 pe-2 max-w-full text-ellipsis overflow-hidden"
                    >
                        {label}
                    </label>
                ) : null }
                <div
                    data-slot="input-wrapper"
                    className={`relative w-full flex tap-highlight-transparent shadow-xs bg-default-100 px-3 gap-3 rounded-medium transition-background motion-reduce:transition-none !duration-150 outline-solid outline-transparent ${multiline ? 'flex-col items-start py-2 min-h-20' : 'flex-row items-center h-9 min-h-9'}`}
                >
                    <div data-slot="inner-wrapper" className={`flex w-full box-border ${multiline ? 'h-auto' : 'h-full items-center'}`}>
                        <div
                            data-slot="input"
                            className={`w-full font-normal bg-transparent outline-none text-small text-default-foreground ${multiline ? 'whitespace-pre-wrap' : ''}`}
                        >
                            {value || '-'} {endContent}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default: inside label placement
    return (
        <div className={`group flex flex-col w-full ${isDisabled ? 'opacity-50' : ''} ${className}`} data-slot="base" data-filled="true" data-filled-within="true" data-has-label="true" data-has-value="true">
            <div
                data-slot="input-wrapper"
                className={`relative w-full flex px-3 flex-col items-start justify-center gap-0 py-2 is-filled ${multiline ? 'min-h-20 h-auto' : 'min-h-10 h-14'}`}
            >
                <label
                    data-slot="label"
                    className="absolute z-10 pointer-events-none origin-top-left shrink-0 rtl:origin-top-right subpixel-antialiased block text-default-600 cursor-text will-change-auto !duration-200 !ease-out motion-reduce:transition-none transition-[transform,color,left,opacity,translate,scale] pointer-events-auto scale-85 text-small -translate-y-[calc(50%_+_var(--heroui-font-size-small)/2_-_6px)] pe-2 max-w-full text-ellipsis overflow-hidden"
                >
                    {label}
                </label>
                <div data-slot="inner-wrapper" className={`flex w-full box-border items-end pb-0.5 ${multiline ? 'h-auto' : 'h-full'}`}>
                    <div
                        data-slot="input"
                        className={`w-full font-normal bg-transparent outline-none text-small text-default-foreground is-filled ${multiline ? 'whitespace-pre-wrap' : ''}`}
                    >
                        {value || '-'} {endContent}
                    </div>
                </div>
            </div>
        </div>
    );
}