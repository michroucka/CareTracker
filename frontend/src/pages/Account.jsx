import {ReadOnlyField} from "../components/ReadOnlyField.jsx";
import {useAccount} from "../hooks/useAccount.jsx";
import {useAuth} from "../contexts/AuthContext.tsx";
import {getRoleLabel} from "../constants/roles.js";
import React from "react";
import {Button, Separator, Form, TextField, Input, Label, FieldError, Spinner} from "@heroui/react";
import {Pencil, Save, UserRound, X, RefreshCw} from "lucide-react";


function Account() {
    const [username, setUsername] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [role, setRole] = React.useState("");
    const [fullName, setFullName] = React.useState("");
    const [errors, setErrors] = React.useState({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    // Snapshot of values at edit start — restored on cancel
    const [savedUsername, setSavedUsername] = React.useState("");
    const [savedEmail, setSavedEmail] = React.useState("");

    const {fetchAccountDetails, updateAccountDetails, requestResetPasswordEmail, isSendingReset} = useAccount();
    const {checkAuth} = useAuth();

    React.useEffect(() => {
        fetchAccountDetails().then(account => {
            setUsername(account.username);
            setEmail(account.email);
            setRole(account.role);
            setFullName(account.fullName);
            setSavedUsername(account.username);
            setSavedEmail(account.email);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const handleEnterEditMode = () => {
        setSavedUsername(username);
        setSavedEmail(email);
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setUsername(savedUsername);
        setEmail(savedEmail);
        setErrors({});
        setIsEditMode(false);
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        const newErrors = {};
        if (!trimmedUsername) {
            newErrors.username = "Prosím zadejte uživatelské jméno";
        } else if (trimmedUsername.length < 4) {
            newErrors.username = "Uživatelské jméno musí obsahovat alespoň 4 znaky";
        }
        if (!trimmedEmail) {
            newErrors.email = "Prosím zadejte email";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const updated = await updateAccountDetails({username: trimmedUsername, email: trimmedEmail});
            setUsername(updated.username);
            setEmail(updated.email);
            setSavedUsername(updated.username);
            setSavedEmail(updated.email);
            setIsEditMode(false);
            await checkAuth();
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100dvh-20rem)] gap-2">
                <Spinner />
                <p className="text-sm text-foreground/60">Načítání údajů...</p>
            </div>
        );
    }

    return (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onSubmit={onSubmit}
        >
            <div className="flex flex-col justify-center items-center gap-4 w-full sm:w-sm">
                <div className="flex flex-col items-center gap-1">
                    <UserRound className="size-14 text-muted" />
                    <h1 className="cursor-default">Můj účet</h1>
                </div>
                <Separator className="mb-3 w-5/6" />

                <div className="flex flex-row items-start gap-4 w-full">
                    <ReadOnlyField label="Jméno" value={fullName} className="flex-1" />
                    <ReadOnlyField label="Role" value={getRoleLabel(role)} className="w-fit! shrink-0" />
                </div>

                {isEditMode ? (
                    <>
                        <TextField name="username" isRequired isInvalid={!!errors.username}>
                            <Label>Uživatelské jméno</Label>
                            <Input
                                isDisabled={isSubmitting}
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (errors.username) {
                                        setErrors({...errors, username: undefined});
                                    }
                                }}
                            />
                            <FieldError>{errors.username}</FieldError>
                        </TextField>

                        <TextField name="email" isRequired type="email" isInvalid={!!errors.email}>
                            <Label>Email</Label>
                            <Input
                                isDisabled={isSubmitting}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) {
                                        setErrors({...errors, email: undefined});
                                    }
                                }}
                            />
                            <FieldError>{errors.email}</FieldError>
                        </TextField>

                        <div className="flex gap-3 w-full">
                            <Button
                                className="flex-1 text-base"
                                variant="tertiary"
                                type="button"
                                isDisabled={isSubmitting}
                                onPress={handleCancelEdit}
                            ><X className="size-4" /> Zrušit</Button>
                            <Button variant="primary"
                                className="flex-1 text-base"
                                type="submit"
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                            ><Save className="size-4" /> {isSubmitting ? "Ukládám..." : "Uložit změny"}</Button>
                        </div>
                    </>
                ) : (
                    <>
                        <ReadOnlyField label="Uživatelské jméno" value={username} />
                        <ReadOnlyField label="Email" value={email} />

                        <Button
                            className="w-full"
                            variant="tertiary"
                            type="button"
                            onPress={handleEnterEditMode}
                        ><Pencil className="size-4" /> Upravit údaje</Button>
                    </>
                )}
                <Button
                    className="w-full"
                    variant="tertiary"
                    type="button"
                    isDisabled={isSendingReset}
                    onPress={requestResetPasswordEmail}
                >isSendingReset ? <Spinner size="sm" /> : <RefreshCw className="size-4" /> Obnovit heslo</Button>
            </div>
        </Form>
    );
}

export default Account;