const REGULAR_CUT = { cell: 96, offset: 24, gap: 16, radius: 28, circleRadius: 50 };
const SMALL_CUT = { cell: 100, offset: 16, gap: 24, radius: 30, circleRadius: 52 };

/**
 * Brand symbol "Buňka". Use `small` at 32 px and below, the small cut keeps the gaps readable.
 */
export function CareTrackerLogo({ className = "", size = "size-8", small = false }) {
    const { cell, offset, gap, radius, circleRadius } = small ? SMALL_CUT : REGULAR_CUT;
    const secondColumn = offset + cell + gap;
    const circleCenter = secondColumn + cell / 2;

    return (
        <svg
            viewBox="0 0 256 256"
            role="img"
            aria-label="CareTracker"
            className={`select-none shrink-0 me-1.5 ${size} ${className}`}
        >
            <g className="fill-plum-700 dark:fill-plum-50">
                <rect x={offset} y={offset} width={cell} height={cell} rx={radius} />
                <rect x={offset} y={secondColumn} width={cell} height={cell} rx={radius} />
                <rect x={secondColumn} y={secondColumn} width={cell} height={cell} rx={radius} />
            </g>
            <circle cx={circleCenter} cy={offset + cell / 2} r={circleRadius} className="fill-apricot-500" />
        </svg>
    );
}
