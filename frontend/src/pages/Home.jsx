import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { IconBuilding, IconBuildingCommunity, IconCalendarDue, IconClipboardCheck, IconClockHour4, IconCoin, IconPlus, IconUser, IconUsers } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { ROLES } from "../constants/roles.js";
import { MONTHS_SHORT } from "../constants/globalConstants.js";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SEGMENT, SEGMENTED_GROUP } from "@/lib/segmented";
import { cn } from "@/lib/utils";
import {
    BarListCard,
    ClientsWithoutRecordsCard,
    PlanUpdatesCard,
    RecentRecordsCard,
    StatTile,
    TrendChart,
} from "@/components/dashboard/DashboardParts";
import { PlatformOverview } from "@/components/dashboard/PlatformOverview";
import {
    formatCompact,
    formatCount,
    formatCurrency,
    formatDuration,
    formatLongDate,
    getGreeting,
    lastTwelveMonthLabels,
    pluralize,
    projectedChange,
    projectMonthEnd,
} from "@/components/dashboard/dashboardFormat";

const MONTH_LABELS = lastTwelveMonthLabels(MONTHS_SHORT);

const previousMonth = (history = []) => history.at(-2) ?? 0;
const formatCompactCurrency = (value) => `${formatCompact(value)} Kč`;

const projectedOf = (history) => (history?.length ? projectMonthEnd(history.at(-1)) : null);

/** Month-end estimate for a tile: the estimate text and its change against the previous month. */
function withProjection(history, format) {
    const projected = projectedOf(history);
    if (projected == null) return {};
    return { projection: `odhad za měsíc ≈ ${format(projected)}`, change: projectedChange(projected, previousMonth(history)) };
}
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const formatAxisCurrency = (value) => (value >= 1000 ? `${Math.round(value / 1000)} tis.` : `${value}`);

function caregiverTiles(dashboard) {
    return [
        {
            icon: IconCalendarDue,
            label: "Dnes",
            value: `${formatCount(dashboard.todayTasksCount)} ${pluralize(dashboard.todayTasksCount, ["úkon", "úkony", "úkonů"])}`,
            hint: dashboard.todayMinutes ? `${formatDuration(dashboard.todayMinutes)} u klientů` : "zatím nic zapsáno",
        },
        {
            icon: IconClipboardCheck,
            label: "Úkony tento měsíc",
            value: formatCount(dashboard.tasksPerformedCount),
            hint: `minulý měsíc ${formatCount(previousMonth(dashboard.tasksPerformedCountHistory))}`,
            ...withProjection(dashboard.tasksPerformedCountHistory, formatCount),
        },
        {
            icon: IconClockHour4,
            label: "Čas u klientů tento měsíc",
            value: formatDuration(dashboard.totalMonthMinutes),
            hint: `${formatCount(dashboard.myClientsCount)} ${pluralize(dashboard.myClientsCount, ["můj klient", "moji klienti", "mých klientů"])}`,
        },
    ];
}

function incomeTile(dashboard) {
    return {
        icon: IconCoin,
        label: "Příjem tento měsíc",
        value: formatCurrency(dashboard.totalMonthlyIncome),
        hint: `minulý měsíc ${formatCurrency(previousMonth(dashboard.monthlyIncomeHistory))}`,
        ...withProjection(dashboard.monthlyIncomeHistory, formatCompactCurrency),
    };
}

function tasksTile(dashboard) {
    return {
        icon: IconClipboardCheck,
        label: "Úkony tento měsíc",
        value: formatCount(dashboard.tasksPerformedCount),
        hint: `minulý měsíc ${formatCount(previousMonth(dashboard.tasksPerformedCountHistory))}`,
        ...withProjection(dashboard.tasksPerformedCountHistory, formatCount),
    };
}

function coordinatorTiles(dashboard) {
    const caregiverCount = dashboard.caregiverWorkload?.length ?? 0;
    const clientsPerCaregiver = caregiverCount ? Math.round(dashboard.clientCount / caregiverCount) : null;
    return [
        incomeTile(dashboard),
        tasksTile(dashboard),
        {
            icon: IconUsers,
            label: "Klienti ve středisku",
            value: formatCount(dashboard.clientCount),
            hint: clientsPerCaregiver != null
                ? `průměrně ${formatCount(clientsPerCaregiver)} ${pluralize(clientsPerCaregiver, ["klient", "klienti", "klientů"])} na pečovatele`
                : "ve středisku zatím nejsou pečovatelé",
        },
    ];
}

function adminTiles(dashboard) {
    return [
        incomeTile(dashboard),
        tasksTile(dashboard),
        {
            icon: IconUsers,
            label: "Aktivní klienti",
            value: formatCount(dashboard.clientCount),
            hint: `${formatCount(dashboard.employeeCount)} zaměstnanců v ${formatCount(dashboard.departmentCount)} ${pluralize(dashboard.departmentCount, ["středisku", "střediscích", "střediscích"])}`,
        },
    ];
}

function workloadItems(workload = []) {
    return workload.map((caregiver) => ({
        key: caregiver.employeeId,
        label: caregiver.name,
        value: caregiver.tasksCount,
        valueLabel: `${formatCount(caregiver.tasksCount)} ${pluralize(caregiver.tasksCount, ["úkon", "úkony", "úkonů"])}`,
        detail: caregiver.minutes ? formatDuration(caregiver.minutes) : null,
    }));
}

function departmentItems(departments = []) {
    return departments.map((department) => ({
        key: department.departmentName,
        label: department.departmentName,
        value: department.performedTasksCount,
        valueLabel: formatCurrency(department.income),
        detail: `${formatCount(department.performedTasksCount)} úkonů`,
    }));
}

const VIEWS = {
    ORGANIZATION: { label: "Organizace", icon: IconBuildingCommunity },
    DEPARTMENT: { label: "Středisko", icon: IconBuilding },
    MINE: { label: "Moje práce", icon: IconUser },
};
const VIEW_STORAGE_KEY = "dashboard_view";

function readStoredView() {
    try {
        return localStorage.getItem(VIEW_STORAGE_KEY);
    } catch {
        return null;
    }
}

function storeView(view) {
    try {
        localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
        // the choice just will not be remembered
    }
}

/**
 * Switch between the dashboard views the user's role allows; hidden when there is only one.
 * Icon and label from 640 px up; on phones icons only (label in a tooltip and for screen readers).
 */
function ViewSwitcher({ views, value, onChange }) {
    if (!views || views.length < 2) return null;
    return (
        <div role="group" aria-label="Pohled nástěnky" className={SEGMENTED_GROUP}>
            {views.map((view, index) => {
                const { label, icon: Icon } = VIEWS[view];
                return (
                    <Tooltip key={view}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                aria-pressed={view === value}
                                aria-label={label}
                                onClick={() => onChange(view)}
                                className={cn(SEGMENT, "px-3 font-normal aria-pressed:bg-secondary aria-pressed:font-medium aria-pressed:text-secondary-foreground", index > 0 && "border-l")}
                            >
                                <Icon />
                                <span className="max-sm:hidden">{label}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="sm:hidden">{label}</TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}

function StaffDashboard({ view, dashboard }) {
    const isCaregiver = view === "MINE";
    const tiles = isCaregiver ? caregiverTiles(dashboard) : view === "DEPARTMENT" ? coordinatorTiles(dashboard) : adminTiles(dashboard);

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3">
                {tiles.map((tile) => <StatTile key={tile.label} {...tile} />)}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <PlanUpdatesCard plans={dashboard.clientIPUpdates} />
                <ClientsWithoutRecordsCard clients={dashboard.clientsWithoutRecentRecords} totalCount={dashboard.clientsWithoutRecentRecordsCount} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                {isCaregiver ? (
                    <TrendChart
                        title="Moje úkony"
                        description={(months) => `Zapsané úkony za posledních ${months} měsíců.`}
                        labels={MONTH_LABELS}
                        values={dashboard.tasksPerformedCountHistory ?? []}
                        projectedValue={projectedOf(dashboard.tasksPerformedCountHistory)}
                        formatValue={(value) => `${formatCount(value)} ${pluralize(value, ["úkon", "úkony", "úkonů"])}`}
                        formatAxis={formatCount}
                    />
                ) : (
                    <TrendChart
                        title={view === "DEPARTMENT" ? "Příjmy střediska" : "Příjmy organizace"}
                        description={(months) => `Vyúčtované úkony za posledních ${months} měsíců.`}
                        labels={MONTH_LABELS}
                        values={dashboard.monthlyIncomeHistory ?? []}
                        projectedValue={projectedOf(dashboard.monthlyIncomeHistory)}
                        formatValue={formatCurrency}
                        formatAxis={formatAxisCurrency}
                    />
                )}
                <RecentRecordsCard records={dashboard.recentPerformedTasks} title={isCaregiver ? "Moje nedávné záznamy" : "Nedávné záznamy"} />
            </div>

            {view === "DEPARTMENT" && (
                <BarListCard
                    title="Vytížení pečovatelů"
                    description="Úkony a čas u klientů v tomto měsíci."
                    items={workloadItems(dashboard.caregiverWorkload)}
                    emptyText="Ve středisku zatím nejsou žádní pečovatelé."
                />
            )}
            {view === "ORGANIZATION" && (
                <BarListCard
                    title="Střediska"
                    description="Příjem a počet úkonů v tomto měsíci."
                    items={departmentItems(dashboard.tasksPerformedByDepartment)}
                    emptyText="Tento měsíc zatím žádné úkony."
                />
            )}
        </>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid gap-6" aria-busy="true" aria-label="Načítání nástěnky">
            <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((index) => <Skeleton key={index} className="h-32 rounded-lg" />)}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-72 rounded-lg" />
                <Skeleton className="h-72 rounded-lg" />
            </div>
            <Skeleton className="h-80 rounded-lg" />
        </div>
    );
}

function DashboardContent() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [dashboard, setDashboard] = React.useState(null);
    const [isSwitching, setIsSwitching] = React.useState(false);
    const isSuperadmin = user.role === ROLES.SUPERADMIN;
    const firstName = (user.fullName || user.username).split(" ")[0];
    // the server checks the view against the role and falls back to the default one
    const requestedView = searchParams.get("view")?.toUpperCase() || readStoredView();

    React.useEffect(() => {
        let isCurrent = true;
        getJSON(requestedView ? `/dashboard?view=${requestedView}` : "/dashboard")
            .then((data) => isCurrent && setDashboard(data))
            .catch((error) => {
                console.error("Error fetching dashboard:", error);
                showErrorToast(error, "Chyba při načítání nástěnky");
            })
            .finally(() => isCurrent && setIsSwitching(false));
        return () => { isCurrent = false; };
    }, [requestedView]);

    const changeView = (view) => {
        if (view === dashboard?.view) return;
        storeView(view);
        setIsSwitching(true);
        setSearchParams((params) => {
            params.set("view", view.toLowerCase());
            return params;
        }, { replace: true });
    };

    return (
        <div className="grid gap-6">
            <PageHeader
                title={isSuperadmin ? "Přehled aplikace" : `${getGreeting()}, ${firstName}`}
                description={isSuperadmin
                    ? "CareTracker napříč organizacemi. Jen souhrnná čísla, bez údajů o klientech."
                    : capitalize(formatLongDate(new Date()))}
                actions={!isSuperadmin && (
                    <>
                        <ViewSwitcher views={dashboard?.availableViews} value={dashboard?.view} onChange={changeView} />
                        <Button asChild>
                            <Link to="/performed-tasks?openCreate=true"><IconPlus /> Zapsat úkon</Link>
                        </Button>
                    </>
                )}
            />

            {!dashboard ? (
                <DashboardSkeleton />
            ) : isSuperadmin ? (
                <PlatformOverview platform={dashboard.platform} />
            ) : (
                <div className={cn("grid gap-6 transition-opacity duration-base", isSwitching && "opacity-60")}>
                    <StaffDashboard view={dashboard.view} dashboard={dashboard} />
                </div>
            )}
        </div>
    );
}

function Home() {
    const { user, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === ROLES.CLIENT) return <Navigate to="/monthly-report" replace />;
    return <DashboardContent />;
}

export default Home;
