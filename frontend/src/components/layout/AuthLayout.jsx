import React from "react";
import { CareTrackerLogo } from "@/components/CareTrackerLogo";
import { CareTrackerWordmark } from "@/components/CareTrackerWordmark";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const GRID_COLUMNS = 44;
const GRID_ROWS = 26;
const CELL_SIZE = 56;
const CELL_GAP = 16;
const CELL_RADIUS = 16;
const WAVE_DURATION_MS = 1400;

const CIRCLE_RATIO = 1 / 50;
// Keeps circles away from the edges of the grid so they are never cut in half
const CIRCLE_EDGE_MARGIN = 3;

// Deterministic pseudo-random generator, so the circles stay in the same places on every visit
function createRandom(seed) {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

/** Positions of the circles; the squares are one repeating SVG pattern. */
function buildCircles() {
    const random = createRandom(7);
    const step = CELL_SIZE + CELL_GAP;
    const center = { x: (GRID_COLUMNS * step) / 2, y: (GRID_ROWS * step) / 2 };
    const maxDistance = Math.hypot(center.x, center.y);
    const circles = [];
    const circleCells = new Set();
    // Circles never touch each other (incl. diagonally), otherwise they form clusters
    const hasCircleNeighbour = (column, row) =>
        [[-1, -1], [0, -1], [1, -1], [-1, 0]].some(([dx, dy]) => circleCells.has(`${column + dx}:${row + dy}`));

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let column = 0; column < GRID_COLUMNS; column++) {
            const isNearEdge = column < CIRCLE_EDGE_MARGIN || row < CIRCLE_EDGE_MARGIN || column >= GRID_COLUMNS - CIRCLE_EDGE_MARGIN || row >= GRID_ROWS - CIRCLE_EDGE_MARGIN;
            // one random draw per cell keeps the circles where they were before the grid became a pattern
            if (random() < CIRCLE_RATIO && !isNearEdge && !hasCircleNeighbour(column, row)) {
                circleCells.add(`${column}:${row}`);
                const x = column * step;
                const y = row * step;
                const cx = x + CELL_SIZE / 2;
                const cy = y + CELL_SIZE / 2;
                const delay = (Math.hypot(cx - center.x, cy - center.y) / maxDistance) * WAVE_DURATION_MS;
                circles.push({ x, y, cx, cy, delay });
            }
        }
    }
    return { circles, step, width: GRID_COLUMNS * step, height: GRID_ROWS * step };
}

/**
 * Background texture from the brand idea: a grid of records where every circle is a person.
 * Fades out towards the middle so the card stays on a clean surface.
 */
function BrandGrid() {
    const patternId = React.useId();
    const { circles, step, width, height } = React.useMemo(buildCircles, []);

    return (
        <svg
            aria-hidden="true"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 size-full [mask-image:radial-gradient(ellipse_at_center,transparent_32%,black_95%)]"
        >
            <defs>
                <pattern id={patternId} width={step} height={step} patternUnits="userSpaceOnUse">
                    <rect width={CELL_SIZE} height={CELL_SIZE} rx={CELL_RADIUS} className="fill-white/[0.02]" />
                </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#${patternId})`} />
            {/* the pattern also has a square under each circle; cover it, the circle is not opaque */}
            <g className="fill-brand-panel">
                {circles.map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} />)}
            </g>
            <g className="fill-highlight/18">
                {circles.map(({ cx, cy, delay }) => (
                    <circle
                        key={`${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={CELL_SIZE / 2 + 1}
                        style={{ animationDelay: `${delay}ms` }}
                        className="origin-center animate-in fade-in-0 zoom-in-0 fill-mode-both duration-slow ease-out [transform-box:fill-box] motion-reduce:animate-none"
                    />
                ))}
            </g>
        </svg>
    );
}

/**
 * Full-screen layout for pages without the app shell (login, account activation, password reset):
 * card centred on the brand colour with the cell-grid texture behind it.
 */
export function AuthLayout({ children }) {
    return (
        <main className="relative grid min-h-svh place-items-center overflow-hidden bg-brand-panel px-4 py-12">
            <BrandGrid />

            <div className="relative grid w-full max-w-md gap-8 rounded-2xl bg-card p-7 text-card-foreground shadow-lg ring-1 ring-black/5 sm:p-10 dark:ring-white/10">
                <ThemeSwitcher className="absolute top-4 right-4 sm:top-7 sm:right-7" />
                <div className="flex items-center pr-12">
                    <CareTrackerLogo size="size-10" className="me-3" />
                    <CareTrackerWordmark className="h-5" />
                </div>
                {children}
            </div>
        </main>
    );
}

/**
 * Title block used at the top of every auth form.
 */
export function AuthHeading({ title, description }) {
    return (
        <div className="grid gap-1.5">
            <h1 className="text-3xl">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
        </div>
    );
}

const MESSAGE_TONES = {
    neutral: "bg-secondary text-secondary-foreground",
    danger: "bg-danger-soft text-danger-soft-foreground",
};

/**
 * Status message instead of a form, e.g. while a link is being verified or when it has expired.
 */
export function AuthMessage({ icon, tone = "neutral", spin = false, title, children, action }) {
    const Icon = icon;
    return (
        <div className="grid gap-6">
            <div className="flex items-start gap-4">
                <span className={`grid size-11 shrink-0 place-items-center rounded-full ${MESSAGE_TONES[tone]}`}>
                    <Icon className={spin ? "size-6 animate-spin" : "size-6"} />
                </span>
                <div className="grid gap-1.5 pt-1">
                    <h1 className="text-2xl">{title}</h1>
                    <p className="text-muted-foreground">{children}</p>
                </div>
            </div>
            {action}
        </div>
    );
}
