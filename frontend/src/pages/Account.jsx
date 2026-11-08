import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconKey, IconLoader2, IconPencil } from "@tabler/icons-react";
import { useAccount } from "../hooks/useAccount.jsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import { getRoleLabel } from "../constants/roles.js";
import { FormField } from "@/components/FormField";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DURATION, EASE_OUT } from "@/lib/motion";

const AnimatedPanel = motion.div;

const MIN_USERNAME_LENGTH = 4;

function initials(name) {
    return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function validate({ username, email }) {
    const errors = {};
    if (!username) errors.username = "Prosím zadejte uživatelské jméno";
    else if (username.length < MIN_USERNAME_LENGTH) errors.username = `Uživatelské jméno musí mít alespoň ${MIN_USERNAME_LENGTH} znaky`;
    if (!email) errors.email = "Prosím zadejte e-mail";
    return errors;
}

function ProfileCard({ fullName, role }) {
    return (
        <Card className="flex-row items-center gap-5 px-6">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-secondary font-display text-2xl font-semibold text-secondary-foreground">
                {initials(fullName)}
            </span>
            <div className="grid min-w-0 gap-1.5">
                <p className="truncate font-display text-2xl font-semibold tracking-tight">{fullName}</p>
                <Badge variant="secondary">{getRoleLabel(role)}</Badge>
            </div>
        </Card>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="grid gap-0.5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium break-all">{value}</dd>
        </div>
    );
}

function CredentialsCard({ account, onSave }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [values, setValues] = React.useState(account);
    const [errors, setErrors] = React.useState({});
    const [submitCount, setSubmitCount] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const startEditing = () => {
        setValues(account);
        setErrors({});
        setIsEditing(true);
    };

    const updateField = (field) => (event) => {
        setValues((previous) => ({ ...previous, [field]: event.target.value }));
        if (errors[field]) setErrors((previous) => ({ ...previous, [field]: undefined }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setSubmitCount((count) => count + 1);

        const trimmed = { username: values.username.trim(), email: values.email.trim() };
        const newErrors = validate(trimmed);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(trimmed);
            setIsEditing(false);
        } catch {
            // the hook already shows an error toast; keep the form open so the user can fix it
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Přihlašovací údaje</CardTitle>
                <CardDescription>Uživatelské jméno pro přihlášení a e-mail pro obnovení hesla.</CardDescription>
                {!isEditing && (
                    <CardAction>
                        <Button variant="outline" size="sm" onClick={startEditing}>
                            <IconPencil /> Upravit
                        </Button>
                    </CardAction>
                )}
            </CardHeader>

            <AnimatePresence mode="wait" initial={false}>
                <AnimatedPanel
                    key={isEditing ? "edit" : "view"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                >
                    {isEditing ? (
                        <form noValidate onSubmit={onSubmit} className="grid gap-6">
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <FormField id="account-username" label="Uživatelské jméno" required error={errors.username} shakeSignal={submitCount}>
                                    {(controlProps) => (
                                        <Input {...controlProps} autoComplete="username" autoFocus disabled={isSubmitting} value={values.username} onChange={updateField("username")} />
                                    )}
                                </FormField>
                                <FormField id="account-email" label="E-mail" required error={errors.email} shakeSignal={submitCount}>
                                    {(controlProps) => (
                                        <Input {...controlProps} type="email" autoComplete="email" disabled={isSubmitting} value={values.email} onChange={updateField("email")} />
                                    )}
                                </FormField>
                            </CardContent>
                            <CardFooter className="justify-end gap-2 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                                    Zrušit
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <IconLoader2 className="animate-spin" />}
                                    {isSubmitting ? "Ukládám…" : "Uložit změny"}
                                </Button>
                            </CardFooter>
                        </form>
                    ) : (
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <DetailRow label="Uživatelské jméno" value={account.username} />
                                <DetailRow label="E-mail" value={account.email} />
                            </dl>
                        </CardContent>
                    )}
                </AnimatedPanel>
            </AnimatePresence>
        </Card>
    );
}

function PasswordCard({ email, isSending, onRequestReset }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Heslo</CardTitle>
                <CardDescription>Pošleme vám e-mail s odkazem, přes který si nastavíte nové heslo. Odkaz přijde na {email}.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button variant="outline" onClick={onRequestReset} disabled={isSending}>
                    {isSending ? <IconLoader2 className="animate-spin" /> : <IconKey />}
                    {isSending ? "Odesílám…" : "Poslat odkaz pro změnu hesla"}
                </Button>
            </CardFooter>
        </Card>
    );
}

function AccountSkeleton() {
    return (
        <div className="grid gap-6" aria-busy="true" aria-label="Načítání údajů">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-44 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
        </div>
    );
}

function Account() {
    const [account, setAccount] = React.useState(null);
    const { fetchAccountDetails, updateAccountDetails, requestResetPasswordEmail, isSendingReset } = useAccount();
    const { checkAuth } = useAuth();

    React.useEffect(() => {
        fetchAccountDetails().then(setAccount).catch(() => {});
        // load once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveCredentials = async (credentials) => {
        const updated = await updateAccountDetails(credentials);
        setAccount((previous) => ({ ...previous, username: updated.username, email: updated.email }));
        await checkAuth();
    };

    return (
        <div className="mx-auto grid w-full max-w-3xl gap-6">
            <PageHeader title="Můj účet" description="Vaše údaje a přihlášení do CareTrackeru." />

            {account ? (
                <>
                    <ProfileCard fullName={account.fullName || account.username} role={account.role} />
                    <CredentialsCard account={{ username: account.username, email: account.email }} onSave={saveCredentials} />
                    <PasswordCard email={account.email} isSending={isSendingReset} onRequestReset={() => requestResetPasswordEmail().catch(() => {})} />
                </>
            ) : (
                <AccountSkeleton />
            )}
        </div>
    );
}

export default Account;
