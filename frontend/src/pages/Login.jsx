import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";
import { post } from "../api/api.js";
import { useAuth } from "../contexts/AuthContext";
import { FormField } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthHeading, AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { DURATION, EASE_OUT } from "@/lib/motion";

const AnimatedPanel = motion.div;

const DEMO_ACCOUNTS = [
    { username: "superadmin", role: "Superadmin" },
    { username: "admin", role: "Admin" },
    { username: "coordinator", role: "Koordinátor" },
    { username: "caregiver", role: "Pečovatel" },
    { username: "client", role: "Klient" },
];
const DEMO_PASSWORD = "heslo";

function LoadingIcon({ isLoading }) {
    return isLoading ? <IconLoader2 className="animate-spin" /> : null;
}

function DemoAccounts({ onPick, disabled }) {
    return (
        <section className="grid gap-3 rounded-lg border bg-card p-4">
            <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-sans text-xs font-semibold tracking-wide text-muted-foreground uppercase">Demo účty</h2>
                <span className="text-xs text-muted-foreground">data se resetují každou noc</span>
            </div>
            <div className="grid gap-1">
                {DEMO_ACCOUNTS.map(({ username, role }) => (
                    <button
                        key={username}
                        type="button"
                        disabled={disabled}
                        onClick={() => onPick(username)}
                        className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-base ease-out outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                    >
                        <span className="font-mono font-medium">{username}</span>
                        <span className="text-xs text-muted-foreground">{role}</span>
                    </button>
                ))}
            </div>
            <p className="border-t pt-3 text-xs text-muted-foreground">
                Kliknutím na účet se vyplní přihlášení. Heslo u všech účtů: <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
            </p>
        </section>
    );
}

function LoginForm({ onForgotPassword }) {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [remember, setRemember] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [submitCount, setSubmitCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth } = useAuth();

    const clearErrors = () => {
        if (errors.username || errors.password) setErrors({});
    };

    const submitLogin = async (event) => {
        event.preventDefault();
        setSubmitCount((count) => count + 1);

        const newErrors = {};
        if (!username.trim()) newErrors.username = "Prosím zadejte uživatelské jméno";
        if (!password.trim()) newErrors.password = "Prosím zadejte heslo";
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            const response = await post("/login", {
                username,
                password,
                "remember-me": remember ? "on" : "",
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Unexpected content type:", contentType);
                throw new Error("Server vrátil neplatnou odpověď");
            }

            const result = await response.json();

            if (response.ok && result.success) {
                await checkAuth();
                toast.success(result.message, { description: `Vítejte, ${result.username}!` });
                navigate(location.state?.from?.pathname || "/", { replace: true });
            } else {
                const errorMessage = result.message || "Neplatné přihlašovací údaje";
                toast.error(errorMessage);
                setErrors({ username: errorMessage, password: errorMessage });
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.message || "Server není dostupný");
        } finally {
            setIsLoading(false);
        }
    };

    const pickDemoAccount = (demoUsername) => {
        setUsername(demoUsername);
        setPassword(DEMO_PASSWORD);
        setErrors({});
    };

    return (
        <>
            <form noValidate onSubmit={submitLogin} className="grid gap-6">
                <AuthHeading title="Přihlášení" description="Přihlaste se ke svému účtu v CareTrackeru." />

                <div className="grid gap-4">
                    <FormField id="login-username" label="Uživatelské jméno" error={errors.username} shakeSignal={submitCount}>
                        {(controlProps) => (
                            <Input
                                {...controlProps}
                                autoComplete="username"
                                autoFocus
                                disabled={isLoading}
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    clearErrors();
                                }}
                            />
                        )}
                    </FormField>

                    <FormField id="login-password" label="Heslo" error={errors.password} shakeSignal={submitCount}>
                        {(controlProps) => (
                            <PasswordInput
                                {...controlProps}
                                autoComplete="current-password"
                                disabled={isLoading}
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    clearErrors();
                                }}
                            />
                        )}
                    </FormField>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Checkbox id="login-remember" checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} disabled={isLoading} />
                            <Label htmlFor="login-remember" className="font-normal">Zapamatovat si mě</Label>
                        </div>
                        <Button type="button" variant="link" className="h-auto px-0" onClick={onForgotPassword} disabled={isLoading}>
                            Zapomenuté heslo?
                        </Button>
                    </div>
                </div>

                <Button type="submit" size="lg" disabled={isLoading}>
                    <LoadingIcon isLoading={isLoading} />
                    {isLoading ? "Přihlašuji…" : "Přihlásit se"}
                </Button>
            </form>

            {import.meta.env.VITE_DEMO_MODE === "true" && <DemoAccounts onPick={pickDemoAccount} disabled={isLoading} />}
        </>
    );
}

function ForgotPasswordForm({ onBack }) {
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState();
    const [submitCount, setSubmitCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    const submitForgot = async (event) => {
        event.preventDefault();
        setSubmitCount((count) => count + 1);

        if (!email.trim()) {
            setError("Prosím zadejte e-mail");
            return;
        }

        setIsLoading(true);
        try {
            const response = await post("/activation/forgot-password", { email });
            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                onBack();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error(error.message || "Server není dostupný");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form noValidate onSubmit={submitForgot} className="grid gap-6">
            <Button type="button" variant="ghost" size="sm" className="-ml-3 justify-self-start text-muted-foreground" onClick={onBack} disabled={isLoading}>
                <IconArrowLeft /> Zpět na přihlášení
            </Button>

            <AuthHeading title="Zapomenuté heslo" description="Zadejte e-mail k účtu a pošleme vám odkaz pro nastavení nového hesla." />

            <FormField id="forgot-email" label="E-mail" error={error} shakeSignal={submitCount}>
                {(controlProps) => (
                    <Input
                        {...controlProps}
                        type="email"
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setError(undefined);
                        }}
                    />
                )}
            </FormField>

            <Button type="submit" size="lg" disabled={isLoading}>
                <LoadingIcon isLoading={isLoading} />
                {isLoading ? "Odesílám…" : "Poslat odkaz"}
            </Button>
        </form>
    );
}

function Login() {
    const [showForgotPassword, setShowForgotPassword] = React.useState(false);

    return (
        <AuthLayout>
            <AnimatePresence mode="wait" initial={false}>
                <AnimatedPanel
                    key={showForgotPassword ? "forgot" : "login"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                    className="grid gap-8"
                >
                    {showForgotPassword ? (
                        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
                    ) : (
                        <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
                    )}
                </AnimatedPanel>
            </AnimatePresence>
        </AuthLayout>
    );
}

export default Login;
