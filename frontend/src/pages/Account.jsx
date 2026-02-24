import {ReadOnlyField} from "../components/ReadOnlyField.jsx";
import {useAccount} from "../hooks/useAccount.jsx";
import {useAuth} from "../contexts/AuthContext.tsx";
import {getRoleLabel} from "../constants/roles.js";
import React from "react";
import {Button, Divider, Form, Input, Spinner} from "@heroui/react";
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

    // Záloha hodnot před editací pro možnost zrušení
    const [savedUsername, setSavedUsername] = React.useState("");
    const [savedEmail, setSavedEmail] = React.useState("");

    const {fetchAccountDetails, updateAccountDetails} = useAccount();
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
            <div className="flex justify-center items-center h-[calc(100dvh-20rem)]">
                <Spinner label="Načítání údajů..." />
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
                    <UserRound className="size-14 text-default-400" />
                    <h1 className="cursor-default">Můj účet</h1>
                </div>
                <Divider className="mb-3 w-5/6" />

                <div className="flex flex-row items-start gap-4 w-full">
                    <ReadOnlyField label="Jméno" value={fullName} className="flex-1" />
                    <ReadOnlyField label="Role" value={getRoleLabel(role)} className="w-fit! shrink-0" />
                </div>

                {isEditMode ? (
                    <>
                        <Input
                            isRequired
                            isDisabled={isSubmitting}
                            isInvalid={!!errors.username}
                            errorMessage={errors.username}
                            label="Uživatelské jméno"
                            labelPlacement="inside"
                            name="username"
                            value={username}
                            onValueChange={(value) => {
                                setUsername(value);
                                if (errors.username) {
                                    setErrors({...errors, username: undefined});
                                }
                            }}
                        />

                        <Input
                            isRequired
                            isDisabled={isSubmitting}
                            isInvalid={!!errors.email}
                            errorMessage={errors.email}
                            label="Email"
                            labelPlacement="inside"
                            name="email"
                            type="email"
                            value={email}
                            onValueChange={(value) => {
                                setEmail(value);
                                if (errors.email) {
                                    setErrors({...errors, email: undefined});
                                }
                            }}
                        />

                        <div className="flex gap-3 w-full">
                            <Button
                                className="flex-1 text-base"
                                variant="flat"
                                type="button"
                                isDisabled={isSubmitting}
                                onPress={handleCancelEdit}
                                startContent={<X className="size-4" />}
                            >
                                Zrušit
                            </Button>
                            <Button
                                className="flex-1 text-base"
                                color="primary"
                                type="submit"
                                isLoading={isSubmitting}
                                isDisabled={isSubmitting}
                                startContent={<Save className="size-4" />}
                            >
                                {isSubmitting ? "Ukládám..." : "Uložit změny"}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <ReadOnlyField label="Uživatelské jméno" value={username} />
                        <ReadOnlyField label="Email" value={email} />

                        <Button
                            className="w-full"
                            variant="flat"
                            type="button"
                            onPress={handleEnterEditMode}
                            startContent={<Pencil className="size-4" />}
                        >
                            Upravit údaje
                        </Button>
                    </>
                )}
                <Button
                    className="w-full"
                    variant="flat"
                    type="button"
                    startContent={<RefreshCw className="size-4" />}
                >
                    Obnovit heslo
                </Button>
            </div>
        </Form>
    );
}

export default Account;