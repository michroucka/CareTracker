import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react";
import { postJSON } from "../api/api.js";
import { useTokenValidation } from "../hooks/useTokenValidation";
import { FormField } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthHeading, AuthLayout, AuthMessage } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

const MIN_USERNAME_LENGTH = 4;
const MIN_PASSWORD_LENGTH = 6;

function validate({ username, password, passwordConfirm }) {
    const errors = {};
    if (!username) errors.username = "Prosím zadejte uživatelské jméno";
    else if (username.length < MIN_USERNAME_LENGTH) errors.username = `Uživatelské jméno musí mít alespoň ${MIN_USERNAME_LENGTH} znaky`;
    if (!password) errors.password = "Prosím zadejte heslo";
    else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků`;
    if (password !== passwordConfirm) errors.passwordConfirm = "Hesla se neshodují";
    return errors;
}

function ActivationForm({ token }) {
    const [values, setValues] = React.useState({ username: "", password: "", passwordConfirm: "" });
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [submitCount, setSubmitCount] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const navigate = useNavigate();

    const updateField = (field) => (event) => {
        setValues((previous) => ({ ...previous, [field]: event.target.value }));
        if (errors[field]) setErrors((previous) => ({ ...previous, [field]: undefined }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setSubmitCount((count) => count + 1);

        const trimmed = {
            username: values.username.trim(),
            password: values.password.trim(),
            passwordConfirm: values.passwordConfirm.trim(),
        };
        const newErrors = validate(trimmed);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await postJSON("/activation/complete", { token, username: trimmed.username, password: trimmed.password });
            toast.success("Účet je aktivovaný", { description: "Teď se můžete přihlásit." });
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Activation error:", error);
            toast.error(error.message || "Server není dostupný");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form noValidate onSubmit={onSubmit} className="grid gap-6">
            <AuthHeading title="Aktivace účtu" description="Zvolte si uživatelské jméno a heslo, kterým se budete přihlašovat." />

            <div className="grid gap-4">
                <FormField id="activate-username" label="Uživatelské jméno" required error={errors.username} hint={`Alespoň ${MIN_USERNAME_LENGTH} znaky.`} shakeSignal={submitCount}>
                    {(controlProps) => (
                        <Input {...controlProps} autoComplete="username" autoFocus disabled={isSubmitting} value={values.username} onChange={updateField("username")} />
                    )}
                </FormField>
                <FormField id="activate-password" label="Heslo" required error={errors.password} hint={`Alespoň ${MIN_PASSWORD_LENGTH} znaků.`} shakeSignal={submitCount}>
                    {(controlProps) => (
                        <PasswordInput
                            {...controlProps}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            isVisible={isPasswordVisible}
                            onVisibleChange={setIsPasswordVisible}
                            value={values.password}
                            onChange={updateField("password")}
                        />
                    )}
                </FormField>
                <FormField id="activate-password-confirm" label="Heslo znovu" required error={errors.passwordConfirm} shakeSignal={submitCount}>
                    {(controlProps) => (
                        <PasswordInput
                            {...controlProps}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            isVisible={isPasswordVisible}
                            onVisibleChange={setIsPasswordVisible}
                            value={values.passwordConfirm}
                            onChange={updateField("passwordConfirm")}
                        />
                    )}
                </FormField>
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <IconLoader2 className="animate-spin" />}
                {isSubmitting ? "Aktivuji účet…" : "Aktivovat účet"}
            </Button>
        </form>
    );
}

function Activate() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const { isValidating, isValid } = useTokenValidation("/activation/validate", token);

    return (
        <AuthLayout>
            {isValidating ? (
                <AuthMessage icon={IconLoader2} spin title="Ověřuji odkaz">
                    Chvíli strpení, kontrolujeme platnost aktivačního odkazu.
                </AuthMessage>
            ) : isValid ? (
                <ActivationForm token={token} />
            ) : (
                <AuthMessage
                    icon={IconAlertCircle}
                    tone="danger"
                    title="Odkaz už neplatí"
                    action={<Button asChild size="lg"><Link to="/login">Přejít na přihlášení</Link></Button>}
                >
                    Aktivační odkaz je neplatný nebo vypršel. O nový požádejte administrátora vaší služby.
                </AuthMessage>
            )}
        </AuthLayout>
    );
}

export default Activate;
