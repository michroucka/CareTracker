import { Form, Input, Checkbox, Button, Divider } from "@heroui/react";
import React from "react";
import { post } from "../api/api.js"
import { ServerStackIcon } from "@heroicons/react/24/solid"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/MyToast";

function Login() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [remember, setRemember] = React.useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const navigate = useNavigate();
    const { login } = useAuth();

    const togglePassword = () => setIsPasswordVisible(!isPasswordVisible);

    const onSubmit = async (e) => {
        e.preventDefault();

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
                // Úspěšné přihlášení
                login(result.username, result.role); // Aktualizace globálního stavu

                showToast({
                    title: result.message,
                    description: `Vítejte ${result.username}!`,
                    color: "success",
                })

                navigate("/");
            } else {
                // Neúspěšné přihlášení - zobrazíme konkrétní chybovou zprávu z backendu
                showToast({
                    title: result.message || "Neplatné přihlašovací údaje",
                    color: "danger",
                })

                setErrors({
                    username: true,
                    password: result.message
                });
            }

        } catch (error) {
            // Chyba při komunikaci se serverem
            console.error("Login error:", error);
            showToast({
                title: error.message || "Server není dostupný",
                color: "danger",
                icon: <ServerStackIcon />,
            })
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
                <h1 className="cursor-pointer">Přihlášení</h1>
                <Divider className="mb-3 w-5/6" />
                <Input
                    required
                    isInvalid={!!errors.username}
                    errorMessage={({validationDetails}) => {
                        if (validationDetails.valueMissing) {
                            return "Prosím zadejte uživatelské jméno";
                        }
                    }}
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
                    required
                    errorMessage={({validationDetails}) => {
                        if (validationDetails.valueMissing) {
                            return "Prosím zadejte heslo";
                        }

                        return errors.password;
                    }}
                    endContent={
                        <button
                            aria-label="toggle password visibility"
                            className="focus:outline-solid outline-transparent"
                            type="button"
                            onClick={togglePassword}
                            title="Zobrazit heslo"
                        >
                            {isPasswordVisible ? (
                                <EyeSlashIcon className="size-6 sm:size-5 pointer-events-none" />
                            ) : (
                                <EyeIcon className="size-6 sm:size-5 pointer-events-none" />
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

                {/* Mobile ver */}
                <Checkbox
                    classNames={{
                        label: [
                            "text-lg"
                        ]
                    }}
                    size="lg"
                    className="self-start sm:hidden py-3"
                    name="remember-me"
                    value="true"
                    isSelected={remember}
                    onValueChange={setRemember}
                >
                    Zapamatovat si mě
                </Checkbox>

                {/* Desktop ver */}
                <Checkbox
                    classNames={{
                        label: [
                            "text-base"
                        ]
                    }}
                    className="self-start hidden sm:block"
                    name="remember-me"
                    value="true"
                    isSelected={remember}
                    onValueChange={setRemember}
                >
                    Zapamatovat si mě
                </Checkbox>

                <div className="flex gap-4 w-full">
                    {/* Mobile ver */}
                    <Button className="w-full text-lg sm:hidden" color="primary" type="submit" size="lg">
                        Přihlásit
                    </Button>
                    <Button className="text-lg sm:hidden" type="reset" variant="bordered" size="lg">
                        Reset
                    </Button>

                    {/* Desktop ver */}
                    <Button className="w-full text-base hidden sm:block" color="primary" type="submit">
                        Přihlásit
                    </Button>
                    <Button className="text-base hidden sm:block" type="reset" variant="bordered">
                        Reset
                    </Button>
                </div>
            </div>
        </Form>
    );
}

export default Login;