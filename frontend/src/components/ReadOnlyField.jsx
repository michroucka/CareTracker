
export function ReadOnlyField({ label, value, className = "" }) {
    return (
        <div className={`group flex flex-col w-full ${className}`} data-slot="base" data-filled="true" data-filled-within="true" data-has-label="true" data-has-value="true">
            <div
                data-slot="input-wrapper"
                className="relative w-full inline-flex px-3 min-h-10 flex-col items-start justify-center gap-0 h-14 py-2 is-filled"
            >
                <label
                    data-slot="label"
                    className="absolute z-10 pointer-events-none origin-top-left shrink-0 rtl:origin-top-right subpixel-antialiased block text-default-600 cursor-text will-change-auto !duration-200 !ease-out motion-reduce:transition-none transition-[transform,color,left,opacity,translate,scale] pointer-events-auto scale-85 text-small -translate-y-[calc(50%_+_var(--heroui-font-size-small)/2_-_6px)] pe-2 max-w-full text-ellipsis overflow-hidden"
                >
                    {label}
                </label>
                <div data-slot="inner-wrapper" className="inline-flex w-full items-center h-full box-border items-end pb-0.5">
                    <div
                        data-slot="input"
                        className="w-full font-normal bg-transparent outline-none text-small text-default-foreground is-filled"
                    >
                        {value || '-'}
                    </div>
                </div>
            </div>
        </div>
    );
}