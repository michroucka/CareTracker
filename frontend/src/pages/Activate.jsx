import { Form, Input, Button, Divider, Spinner, Card, CardBody } from "@heroui/react";
import React from "react";
import { get, postJSON } from "../api/api.js";
import { ServerOff, Eye, EyeOff, UserRoundCheck, UserRoundX, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/MyToast";

function Activate() {
    // Získání tokenu z URL (?token=xyz)
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // Stavy pro validaci tokenu
    const [isValidatingToken, setIsValidatingToken] = React.useState(true);
    const [isTokenValid, setIsTokenValid] = React.useState(false);

    // Stavy pro formulář
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [passwordConfirm, setPasswordConfirm] = React.useState("");
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    // Validace tokenu při načtení stránky
    React.useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidatingToken(false);
                setIsTokenValid(false);
                return;
            }

            try {
                const response = await get(`/activation/validate?token=${token}`);
                const result = await response.json();

                if (response.ok && result.valid) {
                    setIsTokenValid(true);
                } else {
                    setIsTokenValid(false);
                    showToast({
                        title: result.message || "Token je neplatný nebo vypršel",
                        color: "danger",
                        icon: <AlertCircle />
                    });
                }
            } catch (error) {
                console.error("Token validation error:", error);
                setIsTokenValid(false);
                showToast({
                    title: "Chyba při validaci tokenu",
                    color: "danger",
                    icon: <ServerOff />
                });
            } finally {
                setIsValidatingToken(false);
            }
        };

        validateToken();
    }, [token]);

    const onSubmit = async (e) => {
        e.preventDefault();

        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();
        const trimmedPasswordConfirm = passwordConfirm.trim();

        // Validace trimnutých hodnot
        const newErrors = {};
        if (!trimmedUsername) {
            newErrors.username = "Prosím zadejte uživatelské jméno";
        }
        if (trimmedUsername.length < 4) {
            newErrors.username = "Uživatelské jméno musí obsahovat alespoň 4 znaky"
        }
        if (!trimmedPassword) {
            newErrors.password = "Prosím zadejte heslo";
        }
        if (trimmedPassword.length < 6) {
            newErrors.password = "Heslo musí obsahovat alespoň 6 znaků";
        }
        if (trimmedPassword !== trimmedPasswordConfirm) {
            newErrors.passwordConfirm = "Hesla se neshodují";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            // postJSON automaticky hází chyby při !response.ok
            const result = await postJSON("/activation/complete", {
                token: token,
                username: trimmedUsername,
                password: trimmedPassword,
            });

            // Úspěšná aktivace
            await checkAuth();

            showToast({
                title: "Účet byl úspěšně aktivován",
                color: "success",
                icon: <UserRoundCheck />
            });

            navigate("/login", { replace: true });
        } catch (error) {
            // postJSON vytáhne message z ErrorResponse nebo použije default
            console.error("Activation error:", error);
            showToast({
                title: error.message || "Server není dostupný",
                color: "danger",
                icon: <UserRoundX />
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidatingToken) {
        return (
            <div className="w-full flex justify-center items-center min-h-[400px]">
                <Card className="w-sm">
                    <CardBody className="flex flex-col items-center gap-4 py-8">
                        <Spinner size="lg" />
                        <p className="text-lg">Ověřuji aktivační odkaz...</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (!isTokenValid) {
        return (
            <div className="w-full flex justify-center items-center min-h-[400px]">
                <Card className="w-sm">
                    <CardBody className="flex flex-col items-center gap-4 py-8">
                        <AlertCircle className="size-16 text-danger" />
                        <h2 className="text-xl font-semibold">Neplatný aktivační odkaz</h2>
                        <p className="text-center text-foreground/70">
                            Tento odkaz je neplatný nebo již vypršel. Pokud potřebujete nový odkaz, kontaktujte administrátora.
                        </p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Validní token - zobraz formulář
    return (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onSubmit={onSubmit}
        >
            <div className="flex flex-col justify-center items-center gap-4 p-12 w-sm">
                <h1 className="cursor-default">Aktivace účtu</h1>
                <Divider className="mb-3 w-5/6" />

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
                            setErrors({ ...errors, username: undefined });
                        }
                    }}
                />

                <Input
                    isRequired
                    isDisabled={isSubmitting}
                    isInvalid={!!errors.password}
                    errorMessage={errors.password}
                    endContent={
                        <button
                            aria-label="toggle password visibility"
                            className="focus:outline-solid outline-transparent cursor-pointer"
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            title="Zobrazit heslo"
                            disabled={isSubmitting}
                        >
                            {isPasswordVisible ? (
                                <EyeOff className="size-6 sm:size-5 pointer-events-none" />
                            ) : (
                                <Eye className="size-6 sm:size-5 pointer-events-none" />
                            )}
                        </button>
                    }
                    label="Heslo"
                    labelPlacement="inside"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onValueChange={(value) => {
                        setPassword(value);
                        if (errors.password) {
                            setErrors({ ...errors, password: undefined });
                        }
                    }}
                />

                <Input
                    isRequired
                    isDisabled={isSubmitting}
                    isInvalid={!!errors.passwordConfirm}
                    errorMessage={errors.passwordConfirm}
                    endContent={
                        <button
                            aria-label="toggle password confirmation visibility"
                            className="focus:outline-solid outline-transparent cursor-pointer"
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            title="Zobrazit heslo"
                            disabled={isSubmitting}
                        >
                            {isPasswordVisible ? (
                                <EyeOff className="size-6 sm:size-5 pointer-events-none" />
                            ) : (
                                <Eye className="size-6 sm:size-5 pointer-events-none" />
                            )}
                        </button>
                    }
                    label="Potvrzení hesla"
                    labelPlacement="inside"
                    name="passwordConfirm"
                    type={isPasswordVisible ? "text" : "password"}
                    value={passwordConfirm}
                    onValueChange={(value) => {
                        setPasswordConfirm(value);
                        if (errors.passwordConfirm) {
                            setErrors({ ...errors, passwordConfirm: undefined });
                        }
                    }}
                />

                <Button
                    className="w-full text-base"
                    color="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                >
                    {isSubmitting ? "Aktivuji účet..." : "Aktivovat účet"}
                </Button>
            </div>
        </Form>
    );
}

export default Activate;