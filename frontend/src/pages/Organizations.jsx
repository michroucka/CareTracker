import React from "react";
import { IconBan, IconCircleCheck, IconDots, IconLayoutSidebarRightExpand, IconPlus } from "@tabler/icons-react";
import { useOrganizations } from "../hooks/useOrganizations.jsx";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { useDetailParam } from "../hooks/useDetailParam";
import { useRecordDetail } from "../hooks/useRecordDetail";
import { useListFilters } from "../hooks/useListFilters";
import { usePagedList } from "../hooks/usePagedList";
import { removeDiacritics } from "../utils/formatters.js";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { TableEmptyRow } from "@/components/data/EmptyState";
import { TableLoadingRows } from "@/components/data/TableLoadingRows";
import { ListToolbar } from "@/components/data/ListToolbar";
import { TablePagination } from "@/components/data/TablePagination";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrganizationCreateDialog } from "@/components/organizations/OrganizationCreateDialog";
import { OrganizationSheet } from "@/components/organizations/OrganizationSheet";
import { formatBankAccount } from "@/components/organizations/organizationForm";
import { pluralize } from "@/components/dashboard/dashboardFormat";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function Organizations() {
    const { search, setSearch, statusFilter, setStatusFilter, apiStatus } = useListFilters();
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState(null);
    const { detailId, openDetail, closeDetail } = useDetailParam();

    const {
        organizations,
        loading,
        fetchOrganizations,
        fetchOrganization,
        createOrganization,
        updateOrganization,
        terminateOrganization,
        activateOrganization,
    } = useOrganizations();
    const [detail, setDetail] = useRecordDetail(detailId, fetchOrganization, closeDetail);
    const { employees, fetchEmployees } = useEmployees();

    React.useEffect(() => {
        fetchOrganizations({ status: apiStatus });
        // refetch only when the status filter changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiStatus]);

    React.useEffect(() => {
        if (detailId) fetchEmployees({ organizationId: detailId, status: true });
        // candidates for the manager of whichever organization is opened
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId]);

    const visibleOrganizations = React.useMemo(() => {
        const query = removeDiacritics(search.trim());
        return [...organizations]
            .filter((organization) => !query || removeDiacritics(organization.name).includes(query))
            .sort((a, b) => a.name.localeCompare(b.name, "cs"));
    }, [organizations, search]);

    const askTerminate = (organization) => setConfirmAction({ type: "terminate", organization });
    const askActivate = (organization) => setConfirmAction({ type: "activate", organization });

    const runConfirmedAction = async () => {
        const { type, organization } = confirmAction;
        if (type === "terminate") await terminateOrganization(organization.id);
        else await activateOrganization(organization.id);
        if (detail?.id === organization.id) setDetail(await fetchOrganization(organization.id));
    };

    const saveOrganization = async (id, request) => {
        const updated = await updateOrganization(id, request);
        setDetail(updated);
    };

    const { pageItems, tableRef, withPageReset, paginationProps } = usePagedList(visibleOrganizations);
    const count = visibleOrganizations.length;

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Organizace"
                description="Poskytovatelé péče, kteří CareTracker používají."
                actions={<Button onClick={() => setIsCreateOpen(true)}><IconPlus /> Nová organizace</Button>}
            />

            <ListToolbar
                search={search}
                onSearchChange={withPageReset(setSearch)}
                searchPlaceholder="Hledat podle názvu…"
                statusFilter={statusFilter}
                onStatusFilterChange={withPageReset(setStatusFilter)}
                isLoading={loading}
                countLabel={`${count} ${pluralize(count, ["organizace", "organizace", "organizací"])}`}
            />

            <Table ref={tableRef}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Název</TableHead>
                        <TableHead className="@max-3xl/table:hidden">Vedoucí</TableHead>
                        <TableHead className="@max-4xl/table:hidden">Bankovní účet</TableHead>
                        <TableHead>Stav</TableHead>
                        <TableHead className="w-12"><span className="sr-only">Akce</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? <TableLoadingRows rows={4} columns={["", "@max-3xl/table:hidden", "@max-4xl/table:hidden", "", null]} /> : count === 0 ? (
                        search
                            ? <TableEmptyRow columnCount={5} title="Žádná organizace neodpovídá hledání" description="Zkuste jiný název." action={<Button variant="outline" size="sm" onClick={() => setSearch("")}>Zrušit hledání</Button>} />
                            : <TableEmptyRow columnCount={5} title="Zatím tu není žádná organizace" action={<Button size="sm" onClick={() => setIsCreateOpen(true)}><IconPlus /> Nová organizace</Button>} />
                    ) : pageItems.map((organization) => (
                        <TableRow
                            key={organization.id}
                            data-state={organization.id === detailId ? "selected" : undefined}
                            onClick={() => openDetail(organization.id)}
                            className={cn("cursor-pointer", !organization.active && "text-muted-foreground")}
                        >
                            <TableCell className="font-medium">{organization.name}</TableCell>
                            <TableCell className="@max-3xl/table:hidden">{organization.manager?.fullName ?? <span className="text-muted-foreground">–</span>}</TableCell>
                            <TableCell className="tabular-nums @max-4xl/table:hidden">{formatBankAccount(organization) ?? <span className="text-muted-foreground">–</span>}</TableCell>
                            <TableCell>
                                <StatusBadge active={organization.active} />
                            </TableCell>
                            <TableCell onClick={(event) => event.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon-row" variant="ghost" aria-label={`Akce pro ${organization.name}`}><IconDots /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => openDetail(organization.id)}><IconLayoutSidebarRightExpand /> Otevřít detail</DropdownMenuItem>
                                        {organization.active ? (
                                            <DropdownMenuItem variant="destructive" onSelect={() => askTerminate(organization)}><IconBan /> Deaktivovat</DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onSelect={() => askActivate(organization)}><IconCircleCheck /> Aktivovat</DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {!loading && <TablePagination {...paginationProps} />}

            <OrganizationSheet
                open={detailId != null}
                onOpenChange={(open) => !open && closeDetail()}
                organization={detail}
                isLoading={detailId != null && !detail}
                employees={employees}
                onSave={saveOrganization}
                onTerminate={() => askTerminate(detail)}
                onActivate={() => askActivate(detail)}
            />

            <OrganizationCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreate={createOrganization} />

            <ConfirmDialog
                open={confirmAction != null}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={confirmAction?.type === "terminate" ? "Deaktivovat organizaci?" : "Aktivovat organizaci?"}
                description={confirmAction?.type === "terminate"
                    ? `Organizace ${confirmAction.organization.name} se deaktivuje a uživatelské účty jejích zaměstnanců i klientů se zablokují. Později ji můžete znovu aktivovat.`
                    : `Organizace ${confirmAction?.organization.name} bude znovu aktivní. Uživatelské účty zůstanou zablokované, odblokujte je u jednotlivých zaměstnanců a klientů.`}
                confirmLabel={confirmAction?.type === "terminate" ? "Deaktivovat" : "Aktivovat"}
                destructive={confirmAction?.type === "terminate"}
                onConfirm={runConfirmedAction}
            />
        </div>
    );
}

export default Organizations;
