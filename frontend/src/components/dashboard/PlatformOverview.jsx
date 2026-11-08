import { IconBuilding, IconBuildingCommunity, IconClipboardCheck, IconUsersGroup } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS } from "@/constants/roles";
import { MONTHS_SHORT } from "@/constants/globalConstants";
import { BarListCard, StatTile, TrendChart } from "./DashboardParts";
import { formatAgo, formatCount, lastTwelveMonthLabels, pluralize, projectedChange, projectMonthEnd } from "./dashboardFormat";

function OrganizationsCard({ organizations }) {
    return (
        <Card className="min-w-0 gap-4">
            <CardHeader>
                <CardTitle>Organizace</CardTitle>
                <CardDescription>Aktivní organizace seřazené podle počtu úkonů v tomto měsíci.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organizace</TableHead>
                            <TableHead className="text-right">Střediska</TableHead>
                            <TableHead className="text-right">Zaměstnanci</TableHead>
                            <TableHead className="text-right">Klienti</TableHead>
                            <TableHead className="text-right">Úkony v měsíci</TableHead>
                            <TableHead>Poslední aktivita</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizations.map((organization) => (
                            <TableRow key={organization.id}>
                                <TableCell className="font-medium">{organization.name}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCount(organization.departmentCount)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCount(organization.employeeCount)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCount(organization.clientCount)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCount(organization.tasksThisMonth)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {organization.lastActivity ? formatAgo(organization.lastActivity) : "zatím žádná"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function AccountsCard({ activeUsersByRole, pendingActivationCount, expiredActivationCount }) {
    const items = Object.entries(activeUsersByRole).map(([role, count]) => ({
        key: role,
        label: ROLE_LABELS[role] ?? role,
        value: count,
        valueLabel: formatCount(count),
    }));

    return (
        <div className="grid min-w-0 content-start gap-6">
            <BarListCard title="Účty podle role" description="Aktivní uživatelské účty." items={items} emptyText="Zatím žádné účty." />
            <Card className="gap-3">
                <CardHeader>
                    <CardTitle>Pozvánky</CardTitle>
                    <CardDescription>Účty, které čekají na první přihlášení.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Badge variant={pendingActivationCount > 0 ? "pending" : "success"}>
                        {pendingActivationCount > 0
                            ? `${pendingActivationCount} ${pluralize(pendingActivationCount, ["čeká", "čekají", "čeká"])} na aktivaci`
                            : "Žádná nevyřízená pozvánka"}
                    </Badge>
                    {expiredActivationCount > 0 && (
                        <Badge variant="danger">
                            {expiredActivationCount} {pluralize(expiredActivationCount, ["prošlá", "prošlé", "prošlých"])}
                        </Badge>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * SUPERADMIN dashboard: application-wide counts only, never client personal data.
 */
export function PlatformOverview({ platform }) {
    const lastMonthTasks = platform.tasksHistory.at(-2) ?? 0;
    const projectedTasks = projectMonthEnd(platform.tasksThisMonth);
    const totalUsers = Object.values(platform.activeUsersByRole).reduce((sum, count) => sum + count, 0);

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile icon={IconBuildingCommunity} label="Organizace" value={formatCount(platform.organizationCount)} hint={`${formatCount(platform.departmentCount)} středisek`} />
                <StatTile icon={IconUsersGroup} label="Uživatelské účty" value={formatCount(totalUsers)} hint={`${formatCount(platform.employeeCount)} zaměstnanců celkem`} />
                <StatTile icon={IconBuilding} label="Klienti" value={formatCount(platform.clientCount)} hint="aktivní ve všech organizacích" />
                <StatTile
                    icon={IconClipboardCheck}
                    label="Úkony tento měsíc"
                    value={formatCount(platform.tasksThisMonth)}
                    hint={`minulý měsíc ${formatCount(lastMonthTasks)}`}
                    projection={projectedTasks != null ? `odhad za měsíc ≈ ${formatCount(projectedTasks)}` : null}
                    change={projectedChange(projectedTasks, lastMonthTasks)}
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <OrganizationsCard organizations={platform.organizations} />
                <AccountsCard
                    activeUsersByRole={platform.activeUsersByRole}
                    pendingActivationCount={platform.pendingActivationCount}
                    expiredActivationCount={platform.expiredActivationCount}
                />
            </div>

            <TrendChart
                title="Úkony v celé aplikaci"
                description={(months) => `Zapsané úkony za posledních ${months} měsíců napříč organizacemi.`}
                labels={lastTwelveMonthLabels(MONTHS_SHORT)}
                values={platform.tasksHistory}
                projectedValue={projectedTasks}
                formatValue={(value) => `${formatCount(value)} úkonů`}
                formatAxis={formatCount}
            />
        </>
    );
}
