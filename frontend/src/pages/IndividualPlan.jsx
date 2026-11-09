import React from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { IconDots, IconFileDescription, IconHistory, IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useClients } from "../hooks/useClients.jsx";
import { useIndividualPlan } from "../hooks/useIndividualPlan.jsx";
import { useRecordForm } from "../hooks/useRecordForm";
import { ROLES } from "../constants/roles.js";
import { benefitsOptions } from "../constants/clientConstants.js";
import { formatDate } from "../utils/formatters.js";
import { BackToTopButton } from "@/components/BackToTopButton";
import { DatePicker } from "@/components/DatePicker";
import { FormField } from "@/components/FormField";
import { PersonAvatar } from "@/components/PersonAvatar";
import { pictureUrl } from "@/lib/pictures";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { DailyRecordDialog } from "@/components/individualPlan/DailyRecordDialog";
import { PLAN_SECTIONS, planStatus, toFormValues, toRequest, validatePlan } from "@/components/individualPlan/planForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const AnimatedPanel = motion.div;

const ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

function DetailItem({ label, children }) {
    return (
        <div>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium break-words whitespace-pre-line">{children || <span className="font-normal text-muted-foreground">–</span>}</dd>
        </div>
    );
}

function ClientSummaryCard({ client }) {
    return (
        <Card>
            <CardHeader><CardTitle>Klient</CardTitle></CardHeader>
            <CardContent>
                <dl className="grid gap-4">
                    <DetailItem label="Datum narození">{client.dateOfBirth && <span className="tabular-nums">{formatDate(client.dateOfBirth)}</span>}</DetailItem>
                    <DetailItem label="Službu využívá od">{client.created && <span className="tabular-nums">{formatDate(client.created)}</span>}</DetailItem>
                    <DetailItem label="Středisko">{client.department?.city}</DetailItem>
                    <DetailItem label="Klíčový pracovník">{client.caregiver?.fullName}</DetailItem>
                    <DetailItem label="Adresa">{client.street}{"\n"}{client.postalCode} {client.city}</DetailItem>
                    <DetailItem label="Kontakt na příbuzné">{client.relativesContact}</DetailItem>
                    <DetailItem label="Příspěvek na péči">{benefitsOptions.find((option) => option.key === client.benefits)?.name}</DetailItem>
                    <DetailItem label="Svéprávný">{client.legallyCompetent ? "Ano" : "Ne"}</DetailItem>
                </dl>
            </CardContent>
        </Card>
    );
}

function PlanSectionsView({ content }) {
    return PLAN_SECTIONS.map((section) => (
        <Card key={section.title}>
            <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
                {section.fields.map((field) => (
                    <section key={field.name} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                        <span className="grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground"><field.icon className="size-4" /></span>
                        <h3 className="self-center font-sans text-sm font-semibold">{field.label}</h3>
                        <p className={cn("col-start-2 whitespace-pre-line", !content[field.name] && "text-muted-foreground")}>{content[field.name] || "Nevyplněno"}</p>
                    </section>
                ))}
            </CardContent>
        </Card>
    ));
}

function PlanSectionsForm({ form }) {
    return PLAN_SECTIONS.map((section) => (
        <Card key={section.title}>
            <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
                {section.fields.map(({ name, label }) => (
                    <FormField key={name} id={`plan-${name}`} label={label}>
                        {(controlProps) => (
                            <Textarea {...controlProps} rows={3} disabled={form.isSubmitting} value={form.values[name]} onChange={(event) => form.setField(name, event.target.value)} />
                        )}
                    </FormField>
                ))}
            </CardContent>
        </Card>
    ));
}

function DailyRecordsSection({ records, canDelete, onAdd, onDelete }) {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    return (
        <section className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid gap-1">
                    <h2 className="text-2xl">Denní záznamy</h2>
                    <p className="text-muted-foreground">Průběh péče den po dni, nejnovější nahoře.</p>
                </div>
                <Button onClick={onAdd}><IconPlus /> Přidat záznam</Button>
            </div>
            {sorted.length === 0 ? (
                <Card className="py-10 text-center text-muted-foreground">Zatím tu nejsou žádné denní záznamy.</Card>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {sorted.map((record) => (
                        <li key={record.id}>
                            <Card className="h-full gap-3">
                                <CardHeader>
                                    <CardTitle className="font-sans text-base tabular-nums">{formatDate(record.date)}</CardTitle>
                                    <CardDescription>{record.createdBy?.fullName}</CardDescription>
                                    {canDelete(record) && (
                                        <CardAction>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-row" aria-label={`Akce pro záznam z ${formatDate(record.date)}`}><IconDots /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem variant="destructive" onSelect={() => onDelete(record)}><IconTrash /> Smazat záznam</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardAction>
                                    )}
                                </CardHeader>
                                <CardContent><p className="whitespace-pre-line">{record.content}</p></CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function IndividualPlanSkeleton() {
    return (
        <div className="grid gap-6" role="status" aria-label="Načítání individuálního plánu">
            <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="grid gap-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-5 w-48" /></div>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="grid gap-6 lg:col-span-2"><Skeleton className="h-96 rounded-lg" /><Skeleton className="h-96 rounded-lg" /></div>
                <div className="grid gap-6"><Skeleton className="h-40 rounded-lg" /><Skeleton className="h-96 rounded-lg" /></div>
            </div>
        </div>
    );
}

function IndividualPlan() {
    const { clientId } = useParams();
    const { user } = useAuth();
    const isAdmin = ADMIN_ROLES.includes(user.role);

    const [client, setClient] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isEditing, setIsEditing] = React.useState(false);
    const [selectedVersion, setSelectedVersion] = React.useState(null);
    const [dialog, setDialog] = React.useState(null);
    const form = useRecordForm(toFormValues(null));

    const { fetchClient } = useClients();
    const {
        versions, individualPlan, currentContent, loading: isPlanLoading,
        fetchIndividualPlan, fetchVersions, fetchIndividualPlanByVersion,
        createIndividualPlan, updateIndividualPlan, addDailyRecord, removeDailyRecord, reset,
    } = useIndividualPlan();

    React.useEffect(() => {
        let isCurrent = true;
        async function load() {
            setIsLoading(true);
            setIsEditing(false);
            try {
                const [clientData, plan] = await Promise.all([fetchClient(clientId), fetchIndividualPlan(clientId)]);
                if (!isCurrent) return;
                setClient(clientData);
                setSelectedVersion(plan?.currentContent?.versionNumber ?? null);
                if (plan) await fetchVersions(clientId);
            } catch {
                if (isCurrent) setClient(null);
            } finally {
                if (isCurrent) setIsLoading(false);
            }
        }
        load();
        return () => {
            isCurrent = false;
            reset();
        };
        // hook functions are recreated on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId]);

    if (isLoading) return <IndividualPlanSkeleton />;
    if (!client) {
        return (
            <div className="grid justify-items-center gap-4 py-16 text-center">
                <p className="text-muted-foreground">Klient nebyl nalezen.</p>
                <Button variant="outline" asChild><Link to="/clients">Zpět na klienty</Link></Button>
            </div>
        );
    }

    const canEdit = isAdmin || user.employeeId === client.caregiver?.id;
    const latestVersion = individualPlan?.currentContent?.versionNumber;
    const isViewingOldVersion = selectedVersion != null && latestVersion != null && selectedVersion !== latestVersion;
    const fullName = `${client.firstName} ${client.lastName}`;

    const showVersion = async (versionNumber) => {
        setSelectedVersion(versionNumber);
        await fetchIndividualPlanByVersion(clientId, versionNumber);
    };

    const startEditing = async () => {
        if (isViewingOldVersion) await showVersion(latestVersion);
        form.reset(toFormValues(individualPlan?.currentContent));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const saved = await form.submit(validatePlan, async (values) => {
            const request = toRequest(values);
            const plan = individualPlan ? await updateIndividualPlan(clientId, request) : await createIndividualPlan(clientId, request);
            setSelectedVersion(plan.currentContent.versionNumber);
        });
        if (saved) setIsEditing(false);
    };

    // record changes return the plan with its latest content, so the page switches back to the latest version
    const changeRecords = (change) => async (...args) => {
        await change(...args);
        setSelectedVersion(latestVersion);
    };

    const canDeleteRecord = (record) => isAdmin || record.createdBy?.id === user.employeeId;
    const closeDialog = (open) => !open && setDialog(null);
    const status = currentContent?.plannedUpdateDate && !isViewingOldVersion ? planStatus(currentContent.plannedUpdateDate) : null;

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <div className="flex min-w-0 items-center gap-4">
                    <PersonAvatar name={`${client.firstName} ${client.lastName}`} src={pictureUrl("clients", client.id, client.pictureId, "full")} className="size-14 font-display text-xl" />
                    <div className="grid min-w-0 gap-1">
                        <h1 className="text-3xl">{isEditing ? (individualPlan ? "Nová verze plánu" : "Nový individuální plán") : "Individuální plán"}</h1>
                        <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                            <Link to={`/clients/${client.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">{fullName}</Link>
                            {currentContent && !isEditing && <span className="tabular-nums">· verze {currentContent.versionNumber} ze dne {formatDate(currentContent.processedDate)}</span>}
                        </p>
                    </div>
                </div>
                {!isEditing && individualPlan && (
                    <div className="flex flex-wrap items-center gap-2">
                        {versions.length > 1 && (
                            <Select value={selectedVersion ? String(selectedVersion) : ""} onValueChange={(version) => showVersion(Number(version))}>
                                <SelectTrigger className="w-auto min-w-44" aria-label="Verze plánu">
                                    <IconHistory className="text-muted-foreground" /><SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    {versions.map((version) => (
                                        <SelectItem key={version.versionNumber} value={String(version.versionNumber)}>
                                            Verze {version.versionNumber} · {formatDate(version.processedDate)}{version.versionNumber === latestVersion && " (aktuální)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {canEdit && <Button onClick={startEditing}><IconPlus /> Nová verze</Button>}
                    </div>
                )}
            </div>

            {isViewingOldVersion && !isEditing && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-soft bg-warning-soft px-4 py-3 text-warning-soft-foreground">
                    <p>Prohlížíte starší verzi {selectedVersion}. Platí verze {latestVersion}.</p>
                    <Button size="sm" variant="outline" onClick={() => showVersion(latestVersion)}>Zobrazit aktuální verzi</Button>
                </div>
            )}

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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Platnost</CardTitle>
                                    <CardDescription>
                                        Uložením vznikne {individualPlan ? `verze ${latestVersion + 1}` : "první verze"} se dnešním datem zpracování ({formatDate(form.values.processedDate)}). Starší verze zůstanou v historii.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField id="plan-planned-update" label="Plánovaná aktualizace" required error={form.errors.plannedUpdateDate} shakeSignal={form.submitCount} className="sm:max-w-64">
                                        {(controlProps) => (
                                            <DatePicker {...controlProps} minDate={form.values.processedDate} disabled={form.isSubmitting} value={form.values.plannedUpdateDate}
                                                onChange={(date) => form.setField("plannedUpdateDate", date)} />
                                        )}
                                    </FormField>
                                </CardContent>
                            </Card>
                            <PlanSectionsForm form={form} />
                            <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t bg-background/90 px-1 py-4 backdrop-blur">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={form.isSubmitting}>Zrušit</Button>
                                <Button type="submit" disabled={form.isSubmitting}>
                                    {form.isSubmitting && <IconLoader2 className="animate-spin" />}
                                    {form.isSubmitting ? "Ukládám…" : individualPlan ? "Uložit novou verzi" : "Vytvořit plán"}
                                </Button>
                            </div>
                        </form>
                    ) : individualPlan ? (
                        <div className="grid gap-10">
                            <div className="grid items-start gap-6 lg:grid-cols-3">
                                <div className={cn("grid gap-6 transition-opacity duration-fast lg:col-span-2", isPlanLoading && "opacity-60")}>
                                    {currentContent && <PlanSectionsView content={currentContent} />}
                                </div>
                                <div className="grid gap-6">
                                    {currentContent && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Platnost</CardTitle>
                                                {status && <CardAction><Badge variant={status.variant}>{status.label}</Badge></CardAction>}
                                            </CardHeader>
                                            <CardContent>
                                                <dl className="grid gap-4">
                                                    <DetailItem label="Zpracováno"><span className="tabular-nums">{formatDate(currentContent.processedDate)}</span></DetailItem>
                                                    <DetailItem label="Plánovaná aktualizace"><span className="tabular-nums">{formatDate(currentContent.plannedUpdateDate)}</span></DetailItem>
                                                </dl>
                                            </CardContent>
                                        </Card>
                                    )}
                                    <ClientSummaryCard client={client} />
                                </div>
                            </div>
                            <DailyRecordsSection
                                records={individualPlan.dailyRecords ?? []}
                                canDelete={canDeleteRecord}
                                onAdd={() => setDialog({ type: "record" })}
                                onDelete={(record) => setDialog({ type: "deleteRecord", record })}
                            />
                        </div>
                    ) : (
                        <div className="grid items-start gap-6 lg:grid-cols-3">
                            <Card className="items-center gap-4 px-6 py-14 text-center lg:col-span-2">
                                <span className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><IconFileDescription /></span>
                                <div className="grid gap-1">
                                    <p className="font-display text-xl font-semibold">Klient zatím nemá individuální plán</p>
                                    <p className="max-w-md text-muted-foreground">
                                        {canEdit ? "Popište, co je pro klienta důležité a s čím potřebuje pomoct. Každé uložení vytvoří novou verzi." : "Plán může vytvořit klíčový pracovník klienta nebo administrátor."}
                                    </p>
                                </div>
                                {canEdit && <Button onClick={startEditing}><IconPlus /> Vytvořit plán</Button>}
                            </Card>
                            <ClientSummaryCard client={client} />
                        </div>
                    )}
                </AnimatedPanel>
            </AnimatePresence>

            <DailyRecordDialog open={dialog?.type === "record"} onOpenChange={closeDialog} onCreate={changeRecords((record) => addDailyRecord(clientId, record))} />
            <ConfirmDialog
                open={dialog?.type === "deleteRecord"}
                onOpenChange={closeDialog}
                title="Smazat denní záznam?"
                description={dialog?.record ? `Záznam ze dne ${formatDate(dialog.record.date)} se smaže natrvalo.` : ""}
                confirmLabel="Smazat"
                destructive
                onConfirm={changeRecords(() => removeDailyRecord(clientId, dialog.record.id))}
            />
            <BackToTopButton />
        </div>
    );
}

export default IndividualPlan;
