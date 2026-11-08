import React from "react";
import { Link } from "react-router-dom";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "motion/react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { IconChevronRight, IconCircleCheck } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { unitTypeTranslations } from "@/constants/performedTaskConstants";
import { daysFromToday, formatAgo, formatCount, formatRecordDate, pluralize, previousMonthDative } from "./dashboardFormat";

function initials(name = "") {
    return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

/** Change of the month-end estimate against the previous month: green when growing, raspberry below -5 %. */
function TrendBadge({ change, previousMonthLabel }) {
    const percent = Math.round(change * 100);
    const variant = percent > 0 ? "success" : percent < -5 ? "danger" : "secondary";
    const sign = percent > 0 ? "+" : percent < 0 ? "−" : "±";
    return <Badge variant={variant}>{`${sign}${Math.abs(percent)} % proti ${previousMonthLabel}`}</Badge>;
}

/**
 * Summary tile. `projection` is the month-end estimate text; `change` (e.g. -0.15) compares that estimate
 * with the whole previous month.
 */
export function StatTile({ icon, label, value, projection, change, hint }) {
    const Icon = icon;
    return (
        <Card className="gap-4 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
                <div className="grid min-w-0 gap-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="truncate font-display text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon className="size-5" />
                </span>
            </div>
            {(projection || hint) && (
                <div className="mt-auto grid gap-1.5">
                    {projection && (
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span>{projection}</span>
                            {change != null && <TrendBadge change={change} previousMonthLabel={previousMonthDative()} />}
                        </div>
                    )}
                    {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
                </div>
            )}
        </Card>
    );
}

function ChartTooltip({ active, payload, label, formatValue }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    const isCurrentMonth = point.isCurrentMonth && point.estimate != null;
    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
            <p className="text-muted-foreground">{isCurrentMonth ? `${label} (rozpracovaný)` : label}</p>
            <p className="font-semibold tabular-nums">{isCurrentMonth ? `zatím ${formatValue(point.value)}` : formatValue(point.value)}</p>
            {isCurrentMonth && <p className="text-muted-foreground tabular-nums">odhad {formatValue(point.estimate)}</p>}
        </div>
    );
}

const CHART_ANIMATION_MS = 900;
const MOBILE_MONTH_COUNT = 6;

/**
 * 12-month area chart incl. the unfinished current month. With `projectedValue`, a dashed line from the
 * previous month to the month-end estimate is drawn after the area animation finishes.
 */
export function TrendChart({ title, description, labels: allLabels, values: allValues, projectedValue, formatValue, formatAxis = formatValue }) {
    const prefersReducedMotion = useReducedMotion();
    const isMobile = useIsMobile();
    // 12 month labels do not fit on a phone, show the last half year there
    const monthCount = isMobile ? MOBILE_MONTH_COUNT : allValues.length;
    const labels = allLabels.slice(-monthCount);
    const values = allValues.slice(-monthCount);
    const axisTick = { fontSize: isMobile ? 11 : 12, fill: "var(--muted-foreground)" };
    const [isAreaDrawn, setIsAreaDrawn] = React.useState(false);
    const hasProjection = projectedValue != null;
    const lastIndex = values.length - 1;
    const data = values.map((value, index) => ({
        label: labels[index],
        value,
        isCurrentMonth: index === lastIndex,
        estimate: hasProjection && index === lastIndex ? projectedValue : null,
        projection: !hasProjection ? null : index === lastIndex ? projectedValue : index === lastIndex - 1 ? value : null,
    }));
    const gradientId = `trend-fill-${React.useId().replace(/:/g, "")}`;
    const showProjection = hasProjection && (isAreaDrawn || prefersReducedMotion);

    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{typeof description === "function" ? description(monthCount) : description}</CardDescription>}
            </CardHeader>
            {/* fills the card when the neighbouring card in the row is taller */}
            <CardContent className="min-h-60 flex-1 px-3">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 8, right: isMobile ? 8 : 12, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval={0} />
                        <YAxis tickLine={false} axisLine={false} width="auto" tick={axisTick} tickFormatter={formatAxis} />
                        <Tooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltip formatValue={formatValue} />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, fill: "var(--highlight)", stroke: "var(--card)", strokeWidth: 2 }}
                            isAnimationActive={!prefersReducedMotion}
                            animationDuration={CHART_ANIMATION_MS}
                            onAnimationEnd={() => setIsAreaDrawn(true)}
                        />
                        {showProjection && (
                            <Line
                                type="monotone"
                                dataKey="projection"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                strokeDasharray="5 4"
                                strokeOpacity={0.7}
                                connectNulls={false}
                                dot={(props) => props.index === lastIndex
                                    ? <circle key="projection-end" cx={props.cx} cy={props.cy} r={4} fill="var(--card)" stroke="var(--primary)" strokeWidth={2} />
                                    : <g key={`projection-${props.index}`} />}
                                activeDot={false}
                                isAnimationActive={!prefersReducedMotion}
                                animationDuration={500}
                                animationEasing="ease-out"
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function EmptyState({ children }) {
    return (
        <div className="flex items-center gap-3 rounded-md bg-muted px-4 py-5 text-sm text-muted-foreground">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success-soft text-success-soft-foreground">
                <IconCircleCheck className="size-5" />
            </span>
            {children}
        </div>
    );
}

function ListRowLink({ to, children }) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-base ease-out outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            {children}
            <IconChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-base ease-out group-hover:translate-x-0.5" />
        </Link>
    );
}

function planStatus(plannedUpdateDate) {
    const days = daysFromToday(plannedUpdateDate);
    if (days < 0) return { variant: "danger", label: `Po termínu ${-days} ${pluralize(days, ["den", "dny", "dní"])}` };
    if (days === 0) return { variant: "pending", label: "Dnes" };
    if (days <= 7) return { variant: "pending", label: `Za ${days} ${pluralize(days, ["den", "dny", "dní"])}` };
    return { variant: "outline", label: `Za ${days} dní` };
}

export function PlanUpdatesCard({ plans = [] }) {
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>Individuální plány</CardTitle>
                <CardDescription>Aktualizace po termínu nebo v příštích 30 dnech.</CardDescription>
            </CardHeader>
            <CardContent className="px-3">
                {plans.length === 0 ? (
                    <div className="px-3"><EmptyState>Všechny plány jsou aktuální.</EmptyState></div>
                ) : (
                    <ul className="grid gap-0.5">
                        {plans.map((plan) => {
                            const status = planStatus(plan.plannedUpdateDate);
                            return (
                                <li key={plan.clientId}>
                                    <ListRowLink to={`/clients/${plan.clientId}/individual-plan`}>
                                        <span className="min-w-0 flex-1 truncate font-medium">{plan.clientName}</span>
                                        <Badge variant={status.variant}>{status.label}</Badge>
                                    </ListRowLink>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export function ClientsWithoutRecordsCard({ clients = [], totalCount = 0 }) {
    const hiddenCount = totalCount - clients.length;
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>Klienti bez záznamu</CardTitle>
                <CardDescription>Bez provedeného úkonu 14 a více dní.</CardDescription>
                {totalCount > 0 && (
                    <CardAction>
                        <Badge variant="warning">{totalCount}</Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent className="px-3">
                {clients.length === 0 ? (
                    <div className="px-3"><EmptyState>Všichni klienti mají nedávný záznam.</EmptyState></div>
                ) : (
                    <ul className="grid gap-0.5">
                        {clients.map((client) => (
                            <li key={client.clientId}>
                                <ListRowLink to={`/clients/${client.clientId}`}>
                                    <span className="min-w-0 flex-1 truncate font-medium">{client.clientName}</span>
                                    <span className="shrink-0 text-sm text-muted-foreground">
                                        {client.lastRecordDate ? `naposledy ${formatAgo(client.lastRecordDate)}` : "zatím bez záznamu"}
                                    </span>
                                </ListRowLink>
                            </li>
                        ))}
                    </ul>
                )}
                {hiddenCount > 0 && (
                    <p className="px-3 pt-2 text-sm text-muted-foreground">
                        a {hiddenCount} {pluralize(hiddenCount, ["další klient", "další klienti", "dalších klientů"])}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export function RecentRecordsCard({ records = [], title = "Nedávné záznamy" }) {
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-3">
                {records.length === 0 ? (
                    <p className="px-3 text-sm text-muted-foreground">Zatím žádné záznamy.</p>
                ) : (
                    <ul className="grid gap-0.5">
                        {records.map((record) => (
                            <li key={record.id} className="flex items-center gap-3 rounded-md px-3 py-2.5">
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                                    {initials(record.clientName)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{record.clientName}</p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {record.taskName} · <span className="tabular-nums">{formatCount(record.unitCount)} {unitTypeTranslations[record.unitType]}</span>
                                    </p>
                                </div>
                                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{formatRecordDate(record.date)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
            <CardFooter>
                <Button asChild variant="link" className="h-auto px-0">
                    <Link to="/performed-tasks">Všechny záznamy</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

/**
 * Horizontal bar list. Each item: { key, label, value, valueLabel, detail }.
 */
export function BarListCard({ title, description, items = [], emptyText }) {
    const max = Math.max(...items.map((item) => item.value), 1);
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                ) : (
                    <ul className="grid gap-4">
                        {items.map((item) => (
                            <li key={item.key} className="grid gap-1.5">
                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate font-medium">{item.label}</span>
                                    <span className="shrink-0 text-muted-foreground tabular-nums">
                                        <span className="font-semibold text-foreground">{item.valueLabel}</span>
                                        {item.detail && <> · {item.detail}</>}
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn("h-full rounded-full bg-primary transition-[width] duration-slow ease-out", item.value === 0 && "bg-transparent")}
                                        style={{ width: `${(item.value / max) * 100}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
