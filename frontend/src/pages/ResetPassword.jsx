import { Form, TextField, Input, InputGroup, Label, FieldError, Button, Separator, Spinner, Card } from "@heroui/react";
import React from "react";
import { get, putJSON } from "../api/api.js";
import { ServerOff, Eye, EyeOff, UserRoundCheck, UserRoundX, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/MyToast";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [isValidatingToken, setIsValidatingToken] = React.useState(true);
    const [isTokenValid, setIsTokenValid] = React.useState(false);

    const [password, setPassword] = React.useState("");
    const [passwordConfirm, setPasswordConfirm] = React.useState("");
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const navigate = useNavigate();
    const { logoutSilent } = useAuth();

    React.useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidatingToken(false);
                setIsTokenValid(false);
                return;
            }

            try {
                const response = await get(`/activation/validate-reset?token=${token}`);
                const result = await response.json();

                if (response.ok && result.success) {
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

        const trimmedPassword = password.trim();
        const trimmedPasswordConfirm = passwordConfirm.trim();

        const newErrors = {};

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
            await putJSON("/activation/reset-password", {
                token: token,
                password: trimmedPassword,
            });

            await logoutSilent();

            showToast({
                title: "Heslo bylo úspěšně změněno",
                color: "success",
                icon: <UserRoundCheck />
            });

            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Password reset error:", error);
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
                    <Card.Content className="flex flex-col items-center gap-4 py-8">
                        <Spinner size="lg" />
                        <p className="text-lg">Ověřuji platnost odkazu...</p>
                    </Card.Content>
                </Card>
            </div>
        );
    }

    if (!isTokenValid) {
        return (
            <div className="w-full flex justify-center items-center min-h-[400px]">
                <Card className="w-sm">
                    <Card.Content className="flex flex-col items-center gap-4 py-8">
                        <AlertCircle className="size-16 text-danger" />
                        <h2 className="text-xl font-semibold text-center">Neplatný odkaz pro obnovení hesla</h2>
                        <p className="text-center text-foreground/70">
                            Tento odkaz je neplatný nebo již vypršel. Pokud potřebujete nový odkaz, zažádejte o nový na stránce přihlášení.
                        </p>
                    </Card.Content>
                </Card>
            </div>
        );
    }

    return (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onSubmit={onSubmit}
        >
            <div className="flex flex-col justify-center items-center gap-4 p-12 w-sm">
                <h1 className="cursor-default">Obnovení hesla</h1>
                <Separator className="mb-3 w-5/6" />

                <TextField name="password" isRequired type={isPasswordVisible ? "text" : "password"} isInvalid={!!errors.password} className="w-full">
                    <Label>Heslo</Label>
                    <InputGroup>
                        <InputGroup.Input
                            isDisabled={isSubmitting}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) {
                                    setErrors({ ...errors, password: undefined, passwordConfirm: undefined });
                                }
                            }}
                        />
                        <InputGroup.Suffix>
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
                        </InputGroup.Suffix>
                    </InputGroup>
                    <FieldError>{errors.password}</FieldError>
                </TextField>

                <TextField name="passwordConfirm" isRequired type={isPasswordVisible ? "text" : "password"} isInvalid={!!errors.passwordConfirm} className="w-full">
                    <Label>Potvrzení hesla</Label>
                    <InputGroup>
                        <InputGroup.Input
                            isDisabled={isSubmitting}
                            value={passwordConfirm}
                            onChange={(e) => {
                                setPasswordConfirm(e.target.value);
                                if (errors.passwordConfirm) {
                                    setErrors({ ...errors, passwordConfirm: undefined, password: undefined });
                                }
                            }}
                        />
                        <InputGroup.Suffix>
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
                        </InputGroup.Suffix>
                    </InputGroup>
                    <FieldError>{errors.passwordConfirm}</FieldError>
                </TextField>

                <Button variant="primary"
                    className="w-full text-base"
                    type="submit"
                    isPending={isSubmitting}
                    isDisabled={isSubmitting}
                >
                    {isSubmitting ? "Ukládání..." : "Změnit heslo"}
                </Button>
            </div>
        </Form>
    );
}

export default ResetPassword;