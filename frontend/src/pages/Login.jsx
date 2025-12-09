import {Form, Input, Checkbox, Button, Divider, Link} from "@heroui/react";
import React from "react";
import { post } from "../api/api.js"
import { Server, Eye, EyeOff } from "lucide-react"
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

    const togglePassword = () => setIsPasswordVisible(!isPasswordVisible);

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validace před odesláním
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
                // Úspěšné přihlášení - načti kompletní user context včetně department/organization
                await checkAuth(); // Tím získáme employeeId, departmentId, organizationId

                showToast({
                    title: result.message,
                    description: `Vítejte ${result.username}!`,
                    color: "success",
                    icon: <CircleCheck />
                })

                // Přesměruj zpět na původní stránku nebo na home
                const from = location.state?.from?.pathname || "/";
                navigate(from, { replace: true });
            } else {
                // Neúspěšné přihlášení - zobrazíme konkrétní chybovou zprávu z backendu
                const errorMessage = result.message || "Neplatné přihlašovací údaje";

                showToast({
                    title: errorMessage,
                    color: "danger",
                    icon: <CircleX />
                })

                setErrors({
                    username: errorMessage,
                    password: errorMessage
                });
            }

        } catch (error) {
            // Chyba při komunikaci se serverem
            console.error("Login error:", error);
            showToast({
                title: error.message || "Server není dostupný",
                color: "danger",
                icon: <Server />,
            })
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onReset={() => {
                setUsername("");
                setPassword("");
                setRemember(false);
                setErrors({});
            }}
            onSubmit={onSubmit}
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
                    classNames={{
                        inputWrapper: [
                            "bg-content2",
                            "data-[hover=true]:bg-content3",
                            "data-[focus=true]:bg-content3",
                            "shadow-md"
                        ],
                        label: [
                            "text-medium",
                            "group-data-[filled-within=true]:text-foreground/75",
                        ],
                        input: [
                            "text-medium",
                            "font-semibold"
                        ]
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
                    classNames={{
                      inputWrapper: [
                          "bg-content2",
                          "data-[hover=true]:bg-content3",
                          "data-[focus=true]:bg-content3",
                          "shadow-md"
                      ],
                      label: [
                          "text-base",
                          "group-data-[filled-within=true]:text-foreground/75",
                      ],
                        input: [
                            "text-base",
                            "font-semibold"
                        ]
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

                {/* Mobile ver */}
                <Link className="text-foreground/50 hover:text-primary self-start hidden sm:block" size="sm" href="/forgot-password">
                    Zapomenuté heslo?
                </Link>

                {/* Desktop ver */}
                <Link className="text-foreground/50 hover:text-primary self-start sm:hidden" size="md" href="/forgot-password">
                    Zapomenuté heslo?
                </Link>
            </div>
        </Form>
    );
}

export default Login;