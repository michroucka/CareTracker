import React from "react";
import { IconBan, IconCircleCheck, IconDots, IconPlus } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useTasks } from "../hooks/useTasks.jsx";
import { useDetailParam } from "../hooks/useDetailParam";
import { useListFilters } from "../hooks/useListFilters";
import { ROLES } from "../constants/roles.js";
import { removeDiacritics } from "../utils/formatters.js";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { ListToolbar } from "@/components/data/ListToolbar";
import { StatusBadge } from "@/components/data/StatusBadge";
import { pluralize } from "@/components/dashboard/dashboardFormat";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskCreateDialog } from "@/components/tasks/TaskCreateDialog";
import { TaskSheet } from "@/components/tasks/TaskSheet";
import { formatTaskPrice, unitTypeLabel } from "@/components/tasks/taskForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const EDITOR_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

function LoadingRows({ columnCount }) {
    return Array.from({ length: 5 }, (_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
            {Array.from({ length: columnCount }, (_, cell) => (
                <TableCell key={cell}><Skeleton className="h-4 w-24" /></TableCell>
            ))}
        </TableRow>
    ));
}

function Tasks() {
    const { user, superadminOrg } = useAuth();
    const canEdit = EDITOR_ROLES.includes(user.role);
    const { search, setSearch, statusFilter, setStatusFilter, apiStatus } = useListFilters();
    const { detailId, openDetail, closeDetail } = useDetailParam();
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState(null);
    const [detail, setDetail] = React.useState(null);

    const { tasks, setTasks, loading, fetchTasks, fetchTask, createTask, updateTask, terminateTask, activateTask } = useTasks();

    const needsOrganization = user.role === ROLES.SUPERADMIN && !superadminOrg;
    const organizationId = superadminOrg?.id;
    // only admins see inactive tasks, everyone else gets the active catalog
    const status = canEdit ? apiStatus : true;

    React.useEffect(() => {
        if (needsOrganization) {
            setTasks([]);
            return;
        }
        fetchTasks({ organizationId, status });
        // refetch when the organization or the status filter changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, status, needsOrganization]);

    React.useEffect(() => {
        setDetail(null);
        if (!detailId) return;
        fetchTask(detailId).then(setDetail).catch(closeDetail);
        // load whenever another task is opened
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId]);

    const visibleTasks = React.useMemo(() => {
        const query = removeDiacritics(search.trim());
        return [...tasks]
            .filter((task) => !query || removeDiacritics(task.name).includes(query))
            .sort((a, b) => a.name.localeCompare(b.name, "cs"));
    }, [tasks, search]);

    const askTerminate = (task) => setConfirmAction({ type: "terminate", task });
    const askActivate = (task) => setConfirmAction({ type: "activate", task });

    const runConfirmedAction = async () => {
        const { type, task } = confirmAction;
        if (type === "terminate") await terminateTask(task.id);
        else await activateTask(task.id);
        if (detail?.id === task.id) setDetail(await fetchTask(task.id));
    };

    const saveTask = async (id, request) => {
        const updated = await updateTask(id, request);
        setDetail(updated ?? await fetchTask(id));
    };

    const count = visibleTasks.length;
    const columnCount = canEdit ? 6 : 4;

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Úkony"
                description="Katalog služeb, které pečovatelé zapisují a které se klientům účtují."
                actions={canEdit && !needsOrganization && <Button onClick={() => setIsCreateOpen(true)}><IconPlus /> Nový úkon</Button>}
            />

            <ListToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Hledat podle názvu…"
                statusFilter={canEdit ? statusFilter : null}
                onStatusFilterChange={setStatusFilter}
                isLoading={loading && !needsOrganization}
                countLabel={needsOrganization ? null : `${count} ${pluralize(count, ["úkon", "úkony", "úkonů"])}`}
            />

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Název</TableHead>
                        <TableHead className="max-sm:hidden">Jednotka</TableHead>
                        <TableHead className="text-right">Cena</TableHead>
                        <TableHead className="max-md:hidden">Dvojité setkání</TableHead>
                        {canEdit && <TableHead>Stav</TableHead>}
                        {canEdit && <TableHead className="w-12"><span className="sr-only">Akce</span></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {needsOrganization ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={columnCount} className="py-10 text-center text-muted-foreground">Nejdřív vyberte organizaci v postranním panelu.</TableCell>
                        </TableRow>
                    ) : loading ? <LoadingRows columnCount={columnCount} /> : count === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={columnCount} className="py-10 text-center text-muted-foreground">
                                {search ? "Žádný úkon neodpovídá hledání." : "Katalog zatím neobsahuje žádné úkony."}
                            </TableCell>
                        </TableRow>
                    ) : visibleTasks.map((task) => (
                        <TableRow
                            key={task.id}
                            data-state={task.id === detailId ? "selected" : undefined}
                            onClick={() => openDetail(task.id)}
                            className={cn("cursor-pointer", !task.active && "text-muted-foreground")}
                        >
                            <TableCell className="font-medium">{task.name}</TableCell>
                            <TableCell className="max-sm:hidden">{unitTypeLabel(task.unitType)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatTaskPrice(task)}</TableCell>
                            <TableCell className="max-md:hidden">{task.doubleMeeting ? <Badge variant="secondary">Ano</Badge> : <span className="text-muted-foreground">–</span>}</TableCell>
                            {canEdit && <TableCell><StatusBadge active={task.active} /></TableCell>}
                            {canEdit && (
                                <TableCell onClick={(event) => event.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon-sm" variant="ghost" aria-label={`Akce pro úkon ${task.name}`}><IconDots /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => openDetail(task.id)}>Otevřít detail</DropdownMenuItem>
                                            {task.active ? (
                                                <DropdownMenuItem variant="destructive" onSelect={() => askTerminate(task)}><IconBan /> Deaktivovat</DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onSelect={() => askActivate(task)}><IconCircleCheck /> Aktivovat</DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <TaskSheet
                open={detailId != null}
                onOpenChange={(open) => !open && closeDetail()}
                task={detail}
                isLoading={detailId != null && !detail}
                canEdit={canEdit}
                organizationId={organizationId}
                onSave={saveTask}
                onTerminate={() => askTerminate(detail)}
                onActivate={() => askActivate(detail)}
            />

            {canEdit && <TaskCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreate={createTask} organizationId={organizationId} />}

            <ConfirmDialog
                open={confirmAction != null}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={confirmAction?.type === "terminate" ? "Deaktivovat úkon?" : "Aktivovat úkon?"}
                description={confirmAction?.type === "terminate"
                    ? `Úkon ${confirmAction.task.name} už nepůjde zapisovat. Dosavadní záznamy a vyúčtování zůstanou beze změny.`
                    : `Úkon ${confirmAction?.task.name} půjde znovu zapisovat.`}
                confirmLabel={confirmAction?.type === "terminate" ? "Deaktivovat" : "Aktivovat"}
                destructive={confirmAction?.type === "terminate"}
                onConfirm={runConfirmedAction}
            />
        </div>
    );
}

export default Tasks;
