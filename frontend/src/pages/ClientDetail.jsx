import React from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { IconBan, IconCircleCheck, IconDots, IconFileDescription, IconLoader2, IconMapPin, IconPencil } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useClients } from "../hooks/useClients.jsx";
import { useDepartments } from "../hooks/useDepartments.jsx";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { useTasks } from "../hooks/useTasks.jsx";
import { useRecordForm } from "../hooks/useRecordForm";
import { ROLES } from "../constants/roles.js";
import { benefitsOptions, genderTranslations, terminationReasonOptions } from "../constants/clientConstants.js";
import { formatDate } from "../utils/formatters.js";
import { PersonAvatar } from "@/components/PersonAvatar";
import { pictureUrl } from "@/lib/pictures";
import { ClientFields } from "@/components/clients/ClientFields";
import { ClientTerminateDialog } from "@/components/clients/ClientTerminateDialog";
import { toFormValues, toRequest, validateClient } from "@/components/clients/clientForm";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { StatusBadge } from "@/components/data/StatusBadge";
import { pluralize } from "@/components/dashboard/dashboardFormat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { listLocation } from "@/components/layout/navigation";
import { useValueChange } from "@/hooks/useValueChange";

const AnimatedPanel = motion.div;
// the map library is large and only needed after "Na mapě"
const ClientMapDialog = React.lazy(() => import("@/components/clients/ClientMapDialog").then((module) => ({ default: module.ClientMapDialog })));

const EDITOR_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR];

function ageInYears(isoDate) {
    const birth = new Date(isoDate);
    const now = new Date();
    const hadBirthdayThisYear = now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    return now.getFullYear() - birth.getFullYear() - (hadBirthdayThisYear ? 0 : 1);
}

const optionName = (options, key) => options.find((option) => option.key === key)?.name;

function DetailItem({ label, children, className }) {
    return (
        <div className={className}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium break-words whitespace-pre-line">{children || <span className="font-normal text-muted-foreground">–</span>}</dd>
        </div>
    );
}

function DetailCard({ title, action, children }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {action && <CardAction>{action}</CardAction>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function ClientView({ client, onShowMap }) {
    const hasLocation = client.latitude != null && client.longitude != null;
    const tasks = client.tasks ?? [];

    return (
        <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="grid gap-6 lg:col-span-2">
                <DetailCard title="Osobní údaje">
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <DetailItem label="Datum narození">
                            {client.dateOfBirth && <span className="tabular-nums">{formatDate(client.dateOfBirth)} ({ageInYears(client.dateOfBirth)} let)</span>}
                        </DetailItem>
                        <DetailItem label="Pohlaví">{genderTranslations[client.gender]}</DetailItem>
                        <DetailItem label="Osobní číslo">{client.personalNumber != null && <span className="tabular-nums">{client.personalNumber}</span>}</DetailItem>
                        <DetailItem label="Svéprávný">{client.legallyCompetent ? "Ano" : "Ne"}</DetailItem>
                    </dl>
                </DetailCard>

                <DetailCard
                    title="Adresa a kontakt"
                    action={hasLocation && <Button variant="outline" size="sm" onClick={onShowMap}><IconMapPin /> Na mapě</Button>}
                >
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <DetailItem label="Adresa" className="sm:col-span-2">
                            {client.street}<br /><span className="tabular-nums">{client.postalCode}</span> {client.city}
                        </DetailItem>
                        <DetailItem label="Telefon">
                            {client.phone && <a href={`tel:${client.phone.replace(/\s/g, "")}`} className="tabular-nums underline-offset-4 hover:underline">{client.phone}</a>}
                        </DetailItem>
                        <DetailItem label="E-mail">
                            {client.email && <a href={`mailto:${client.email}`} className="break-all underline-offset-4 hover:underline">{client.email}</a>}
                        </DetailItem>
                        <DetailItem label="Kontakt na příbuzné">{client.relativesContact}</DetailItem>
                        <DetailItem label="Praktický lékař">{client.generalPractitioner}</DetailItem>
                    </dl>
                </DetailCard>

                <DetailCard title="Poznámky">
                    {client.notes
                        ? <p className="whitespace-pre-line">{client.notes}</p>
                        : <p className="text-muted-foreground">Bez poznámek.</p>}
                </DetailCard>
            </div>

            <div className="grid gap-6">
                <DetailCard title="Péče">
                    <dl className="grid gap-4">
                        <DetailItem label="Středisko">{client.department?.city}</DetailItem>
                        <DetailItem label="Klíčový pracovník">{client.caregiver?.fullName}</DetailItem>
                        <DetailItem label="Příspěvek na péči">{optionName(benefitsOptions, client.benefits)}</DetailItem>
                        <DetailItem label="Klientem od">{client.created && <span className="tabular-nums">{formatDate(client.created)}</span>}</DetailItem>
                    </dl>
                </DetailCard>

                <DetailCard title={tasks.length ? `${tasks.length} ${pluralize(tasks.length, ["úkon", "úkony", "úkonů"])}` : "Úkony"}>
                    {tasks.length ? (
                        <ul className="flex flex-wrap gap-1.5">
                            {tasks.map((task) => <li key={task.id}><Badge variant="secondary">{task.name}</Badge></li>)}
                        </ul>
                    ) : <p className="text-muted-foreground">Klient nemá přiřazené žádné úkony.</p>}
                </DetailCard>

                {!client.active && (
                    <DetailCard title="Ukončení smlouvy">
                        <dl className="grid gap-4">
                            <DetailItem label="Datum ukončení">{client.terminationDate && <span className="tabular-nums">{formatDate(client.terminationDate)}</span>}</DetailItem>
                            <DetailItem label="Důvod">{optionName(terminationReasonOptions, client.terminationReason)}</DetailItem>
                        </dl>
                    </DetailCard>
                )}
            </div>
        </div>
    );
}

function ClientDetailSkeleton() {
    return (
        <div className="grid gap-6" role="status" aria-label="Načítání klienta">
            <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="grid gap-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-5 w-40" /></div>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="grid gap-6 lg:col-span-2"><Skeleton className="h-40 rounded-lg" /><Skeleton className="h-56 rounded-lg" /></div>
                <div className="grid gap-6"><Skeleton className="h-56 rounded-lg" /><Skeleton className="h-32 rounded-lg" /></div>
            </div>
        </div>
    );
}

export function ClientDetail() {
    const { clientId } = useParams();
    const { user } = useAuth();
    const canEdit = EDITOR_ROLES.includes(user.role);

    const [client, setClient] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isEditing, setIsEditing] = React.useState(false);
    const [dialog, setDialog] = React.useState(null);
    const form = useRecordForm(toFormValues(null));

    const { fetchClient, updateClient, terminateClient, activateClient } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();
    const { tasks, fetchTasks } = useTasks();

    const loadClient = React.useCallback(
        () => fetchClient(Number(clientId))
            .then(setClient, () => setClient(null))
            .finally(() => setIsLoading(false)),
        // fetchClient is recreated on every render of the hook
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [clientId],
    );

    useValueChange(clientId, () => {
        setIsLoading(true);
        setIsEditing(false);
    });

    React.useEffect(() => {
        loadClient();
    }, [loadClient]);

    React.useEffect(() => {
        if (!canEdit) return;
        fetchDepartments({ status: true });
        fetchEmployees({ status: true });
        fetchTasks({ status: true });
        // options for the edit form are loaded once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canEdit]);

    const startEditing = () => {
        form.reset(toFormValues(client));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const saved = await form.submit(
            (values) => validateClient(values, { withTermination: !client.active }),
            async (values) => setClient(await updateClient(client.id, toRequest(values))),
        );
        if (saved) setIsEditing(false);
    };

    const runAndReload = (action) => async (...args) => {
        await action(...args);
        await loadClient();
    };

    const closeDialog = (open) => !open && setDialog(null);

    if (isLoading) return <ClientDetailSkeleton />;
    if (!client) {
        return (
            <div className="grid justify-items-center gap-4 py-16 text-center">
                <p className="text-muted-foreground">Klient nebyl nalezen.</p>
                <Button variant="outline" asChild><Link to={listLocation("/clients")}>Zpět na klienty</Link></Button>
            </div>
        );
    }

    const fullName = `${client.firstName} ${client.lastName}`;
    const address = `${client.street}, ${client.postalCode} ${client.city}`;

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <div className="flex min-w-0 items-center gap-4">
                    <PersonAvatar name={`${client.firstName} ${client.lastName}`} src={pictureUrl("clients", client.id, client.pictureId, "full")} className="size-16 font-display text-2xl" />
                    <div className="grid min-w-0 gap-1.5">
                        <h1 className="truncate text-3xl">{isEditing ? "Úprava klienta" : fullName}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <StatusBadge active={client.active} />
                            <span>{[client.department?.city, client.caregiver?.fullName].filter(Boolean).join(" · ")}</span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link to={`/clients/${client.id}/individual-plan`}><IconFileDescription /> Individuální plán</Link>
                        </Button>
                        {canEdit && <Button onClick={startEditing}><IconPencil /> Upravit</Button>}
                        {canEdit && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" aria-label="Další akce"><IconDots /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {client.active ? (
                                        <DropdownMenuItem variant="destructive" onSelect={() => setDialog("terminate")}><IconBan /> Ukončit smlouvu</DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onSelect={() => setDialog("activate")}><IconCircleCheck /> Znovu aktivovat</DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
                <AnimatedPanel
                    key={isEditing ? "edit" : "view"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                >
                    {isEditing ? (
                        <form noValidate onSubmit={save} className="mx-auto grid max-w-3xl gap-6">
                            <ClientFields
                                idPrefix="client-edit"
                                values={form.values}
                                errors={form.errors}
                                onChange={form.setField}
                                disabled={form.isSubmitting}
                                shakeSignal={form.submitCount}
                                departments={departments}
                                caregivers={employees}
                                tasks={tasks}
                                hasSavedPicture={Boolean(client.pictureId)}
                                withTermination={!client.active}
                            />
                            <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t bg-background/90 px-1 py-4 backdrop-blur">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={form.isSubmitting}>Zrušit</Button>
                                <Button type="submit" disabled={form.isSubmitting}>
                                    {form.isSubmitting && <IconLoader2 className="animate-spin" />}
                                    {form.isSubmitting ? "Ukládám…" : "Uložit změny"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <ClientView client={client} onShowMap={() => setDialog("map")} />
                    )}
                </AnimatedPanel>
            </AnimatePresence>

            {client.latitude != null && client.longitude != null && dialog === "map" && (
                <React.Suspense fallback={null}>
                    <ClientMapDialog open onOpenChange={closeDialog} latitude={client.latitude} longitude={client.longitude} address={address} />
                </React.Suspense>
            )}
            <ClientTerminateDialog open={dialog === "terminate"} onOpenChange={closeDialog} client={{ ...client, fullName }} onTerminate={runAndReload(terminateClient)} />
            <ConfirmDialog
                open={dialog === "activate"}
                onOpenChange={closeDialog}
                title="Znovu aktivovat klienta?"
                description={`${fullName} bude znovu aktivním klientem a půjde mu zapisovat péči.`}
                confirmLabel="Aktivovat"
                onConfirm={runAndReload(() => activateClient(client.id))}
            />
        </div>
    );
}
