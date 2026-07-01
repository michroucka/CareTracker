import {Form, Input, Checkbox, Button, Divider, Link} from "@heroui/react";
import React from "react";
import {post} from "../api/api.js"
import { ServerOff, Eye, EyeOff, UserRoundCheck, UserRoundX, ArrowLeft, MailCheck, MailX, Users, Edit, FileText } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/MyToast";
import { CareTrackerLogo } from "../components/CareTrackerLogo.jsx";
import { ThemeSwitcher } from "../components/ThemeSwitcher.jsx";
import ctIcon from "../assets/ct_icon.svg";

const brandingFeatures = [
    {
        icon: Users,
        title: "Evidence klientů",
        text: "Přehled o klientech, jejich potřebách a historii poskytované péče — bezpečně na jednom místě.",
    },
    {
        icon: Edit,
        title: "Záznam poskytnuté péče",
        text: "Pečovatelé snadno zapisují provedené úkony a čas strávený u klientů, bez papírových výkazů.",
    },
    {
        icon: FileText,
        title: "Přehledy a reporty",
        text: "Měsíční souhrny a vyúčtování exportovatelná do PDF.",
    },
];

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

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Unexpected content type:", contentType);
                throw new Error("Server vrátil neplatnou odpověď");
            }

            const result = await response.json();

            if (response.ok && result.success) {
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

    return (
        <div className="flex gap-6 h-full relative">
            <div className="absolute top-0 right-0 z-10">
                <ThemeSwitcher />
            </div>

            {/* Branding panel — jen desktop */}
            <div className="hidden sm:flex flex-col justify-between gap-8 w-3/5 bg-primary/5 dark:bg-content2/50 border border-primary/10 dark:border-default-100 rounded-2xl p-10 relative overflow-hidden">
                <div aria-hidden="true" className="absolute -top-16 -right-16 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
                <div aria-hidden="true" className="absolute -bottom-20 -left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
                <img src={ctIcon} alt="" aria-hidden="true" className="absolute right-6 bottom-6 w-48 opacity-[0.04] select-none pointer-events-none" draggable={false} />

                <div className="relative flex items-center gap-2">
                    <CareTrackerLogo size="size-24" />
                    <span className="font-bold text-6xl">CareTracker</span>
                </div>

                <div className="relative flex flex-col gap-2">
                    <p className="text-4xl font-bold leading-snug">Pomáháme pečovat<br />s přehledem a jistotou</p>
                    <p className="text-foreground/60 mt-1">
                        Systém pro koordinaci a správu pečovatelských služeb
                    </p>
                </div>

                <div className="relative flex flex-col gap-5">
                    {brandingFeatures.map(({ icon: Icon, title, text }) => (
                        <div key={title} className="flex items-start gap-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                                <Icon className="size-7 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold">{title}</p>
                                <p className="text-sm text-foreground/60 mt-0.5 leading-relaxed">{text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Formulář */}
            <div className="flex-1 flex items-center justify-center py-8 overflow-y-auto">
                <div className="w-full max-w-sm flex flex-col gap-6">
                    <div className="sm:hidden flex items-center gap-3">
                        <CareTrackerLogo size="size-14" />
                        <div>
                            <p className="font-bold text-4xl leading-tight">CareTracker</p>
                            <p className="text-sm text-foreground/60">Systém pro správu pečovatelských služeb</p>
                        </div>
                    </div>
                {!showForgotPassword ? (
                    <Form
                        className="w-full"
                        validationErrors={errors}
                        onReset={() => {
                            setUsername("");
                            setPassword("");
                            setRemember(false);
                            setErrors({});
                        }}
                        onSubmit={submitLogin}
                    >
                        <div className="flex flex-col gap-4 w-full">
                            <p className="cursor-default text-3xl sm:text-4xl leading-tight font-bold mt-8 sm:mt-0">Přihlásit se</p>
                            <Divider className="mb-2" />

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
                                    if (errors.username || errors.password) setErrors({});
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
                                    if (errors.username || errors.password) setErrors({});
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
                                    size="lg"
                                >
                                    {isLoading ? "Přihlašování..." : "Přihlásit"}
                                </Button>
                                <Button
                                    className="text-base"
                                    type="reset"
                                    variant="bordered"
                                    isDisabled={isLoading}
                                    size="lg"
                                >
                                    Reset
                                </Button>
                            </div>

                            <Link
                                className="text-foreground/50 hover:text-primary cursor-pointer text-sm"
                                onPress={() => setShowForgotPassword(true)}
                            >
                                Zapomenuté heslo?
                            </Link>
                        </div>
                    </Form>
                ) : (
                    <Form
                        className="w-full"
                        validationErrors={errors}
                        onSubmit={submitForgot}
                    >
                        <div className="flex flex-col gap-4 w-full">
                            <h2 className="cursor-default mb-1">Zapomenuté heslo</h2>
                            <Divider className="mb-2" />

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
                                    if (errors.email) setErrors({});
                                }}
                                classNames={{ description: "text-foreground/50" }}
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
                                className="text-foreground/50 hover:text-primary cursor-pointer text-sm"
                                onPress={() => {
                                    setShowForgotPassword(false);
                                    setEmail("");
                                }}
                            >
                                <ArrowLeft className="pe-1" /> Zpět na přihlášení
                            </Link>
                        </div>
                    </Form>
                )}
                {import.meta.env.VITE_DEMO_MODE === 'true' && (
                    <div className="border border-default-200 rounded-xl p-4 bg-default-50 dark:bg-default-100/50">
                        <div className="flex items-baseline justify-between mb-3">
                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Demo přihlašovací údaje</p>
                            <p className="text-xs text-foreground/35 italic">data se resetují každou noc</p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {[
                                { username: "superadmin", role: "Superadmin" },
                                { username: "admin",       role: "Admin" },
                                { username: "coordinator", role: "Koordinátor" },
                                { username: "caregiver",   role: "Pečovatel" },
                                { username: "client",      role: "Klient" },
                            ].map(({ username, role }) => (
                                <div key={username} className="flex justify-between items-baseline gap-2 text-sm">
                                    <span className="font-mono font-medium">{username}</span>
                                    <span className="text-foreground/40 text-xs">{role}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-default-200 text-xs text-foreground/40">
                            Heslo u všech účtů: <span className="font-mono text-foreground/60">heslo</span>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}

export default Login;