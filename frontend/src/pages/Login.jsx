import {Form, Input, Checkbox, Button, Divider, Link} from "@heroui/react";
import React from "react";
import {post} from "../api/api.js"
import { ServerOff, Eye, EyeOff, UserRoundCheck, UserRoundX, ArrowLeft, MailCheck, MailX } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/MyToast";

function Login() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [remember, setRemember] = React.useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, checkAuth } = useAuth();

    const [showForgotPassword, setShowForgotPassword] = React.useState(false);
    const [email, setEmail] = React.useState("");

    const togglePassword = () => setIsPasswordVisible(!isPasswordVisible);

    const submitLogin = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!username.trim()) {
            newErrors.username = "Prosím zadejte uživatelské jméno";
        }
        if (!password.trim()) {
            newErrors.password = "Prosím zadejte heslo";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        try {
            const response = await post("/login", {
                username: username,
                password: password,
                "remember-me": remember ? "on" : ""
            });

            // Kontrola, zda response obsahuje JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Unexpected content type:", contentType);
                throw new Error("Server vrátil neplatnou odpověď");
            }

            const result = await response.json();

            if (response.ok && result.success) {
                // Fetch the full auth context (employeeId, departmentId, organizationId) after login
                await checkAuth();

                showToast({
                    title: result.message,
                    description: `Vítejte ${result.username}!`,
                    color: "success",
                    icon: <UserRoundCheck />
                })

                const from = location.state?.from?.pathname || "/";
                navigate(from, { replace: true });
            } else {
                const errorMessage = result.message || "Neplatné přihlašovací údaje";

                showToast({
                    title: errorMessage,
                    color: "danger",
                    icon: <UserRoundX />
                })

                setErrors({
                    username: errorMessage,
                    password: errorMessage
                });
            }

        } catch (error) {
            console.error("Login error:", error);
            showToast({
                title: error.message || "Server není dostupný",
                color: "danger",
                icon: <ServerOff />,
            })
        } finally {
            setIsLoading(false);
        }
    };

    const submitForgot = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = "Prosím zadejte email";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        try {
            const response = await post("/activation/forgot-password", { email: email });
            const result = await response.json();

            showToast({
                title: result.message,
                color: result.success ? "success" : "danger",
                icon: result.success ? <MailCheck /> : <MailX />
            });

            if (result.success) {
                setShowForgotPassword(false);
                setEmail("");
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            showToast({
                title: error.message || "Server není dostupný",
                color: "danger",
                icon: <ServerOff />,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (!showForgotPassword ? (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onReset={() => {
                setUsername("");
                setPassword("");
                setRemember(false);
                setErrors({});
            }}
            onSubmit={submitLogin}
        >
            <div className="flex flex-col justify-center items-center gap-4 p-12 w-sm">
                <h1 className="cursor-default">Přihlášení</h1>
                <Divider className="mb-3 w-5/6" />
                <Input
                    isDisabled={isLoading}
                    isInvalid={!!errors.username}
                    errorMessage={errors.username}
                    label="Uživatelské jméno"
                    labelPlacement="inside"
                    name="username"
                    value={username}
                    onValueChange={(value) => {
                        setUsername(value);
                        if (errors.username || errors.password) {
                            setErrors({});
                        }
                    }}
                />

                <Input
                    isDisabled={isLoading}
                    isInvalid={!!errors.password}
                    errorMessage={errors.password}
                    endContent={
                        <button
                            aria-label="toggle password visibility"
                            className="focus:outline-solid outline-transparent cursor-pointer"
                            type="button"
                            onClick={togglePassword}
                            title="Zobrazit heslo"
                            disabled={isLoading}
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
                        if (errors.username || errors.password) {
                            setErrors({});
                        }
                    }}
                />

                <Checkbox
                    className="self-start"
                    name="remember-me"
                    value="true"
                    isSelected={remember}
                    onValueChange={setRemember}
                    isDisabled={isLoading}
                >
                    Zapamatovat si mě
                </Checkbox>

                <div className="flex gap-4 w-full">
                    <Button
                        className="w-full text-base"
                        color="primary"
                        type="submit"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                    >
                        {isLoading ? "Přihlašování..." : "Přihlásit"}
                    </Button>
                    <Button
                        className="text-base"
                        type="reset"
                        variant="bordered"
                        isDisabled={isLoading}
                    >
                        Reset
                    </Button>
                </div>

                <Link className="text-foreground/50 hover:text-primary cursor-pointer" onPress={() => setShowForgotPassword(true)}>
                    Zapomenuté heslo?
                </Link>
            </div>
        </Form>
    )
        :
    (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onSubmit={submitForgot}
        >
            <div className="flex flex-col justify-center items-center gap-4 p-12 w-sm">
                <h2 className="cursor-default">Zapomenuté heslo</h2>
                <Divider className="mb-3 w-5/6" />
                <Input
                    isDisabled={isLoading}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                    label="Email"
                    labelPlacement="inside"
                    type="email"
                    description="Sem Vám přijdou instrukce pro obnovení hesla"
                    name="email"
                    value={email}
                    onValueChange={(value) => {
                        setEmail(value);
                        if (errors.email || errors.email) {
                            setErrors({});
                        }
                    }}
                    classNames={{
                        description: "text-foreground/50"
                    }}
                />

                <div className="flex gap-4 w-full">
                    <Button
                        className="w-full text-base"
                        color="primary"
                        type="submit"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                    >
                        {isLoading ? "Odesílání..." : "Odeslat"}
                    </Button>
                </div>

                <Link
                    className="text-foreground/50 hover:text-primary cursor-pointer"
                    onPress={() => {
                        setShowForgotPassword(false);
                        setEmail("");
                    }}
                >
                    <ArrowLeft className="pe-1" /> Zpět na přihlášení
                </Link>
            </div>
        </Form>
    ));
}

export default Login;