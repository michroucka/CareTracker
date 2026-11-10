import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react";
import { putJSON, userMessageOf } from "../api/api.js";
import { useAuth } from "../contexts/AuthContext";
import { useTokenValidation } from "../hooks/useTokenValidation";
import { FormField } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthHeading, AuthLayout, AuthMessage } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

const MIN_PASSWORD_LENGTH = 6;

function validate({ password, passwordConfirm }) {
    const errors = {};
    if (!password) errors.password = "Prosím zadejte heslo";
    else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků`;
    if (password !== passwordConfirm) errors.passwordConfirm = "Hesla se neshodují";
    return errors;
}

function ResetPasswordForm({ token }) {
    const [values, setValues] = React.useState({ password: "", passwordConfirm: "" });
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [submitCount, setSubmitCount] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const navigate = useNavigate();
    const { logoutSilent } = useAuth();

    const updateField = (field) => (event) => {
        setValues((previous) => ({ ...previous, [field]: event.target.value }));
        if (errors.password || errors.passwordConfirm) setErrors({});
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setSubmitCount((count) => count + 1);

        const trimmed = { password: values.password.trim(), passwordConfirm: values.passwordConfirm.trim() };
        const newErrors = validate(trimmed);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await putJSON("/activation/reset-password", { token, password: trimmed.password });
            await logoutSilent();
            toast.success("Heslo je změněné", { description: "Přihlaste se novým heslem." });
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error(userMessageOf(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form noValidate onSubmit={onSubmit} className="grid gap-6">
            <AuthHeading title="Nové heslo" description="Zvolte si nové heslo k účtu." />

            <div className="grid gap-4">
                <FormField id="reset-password" label="Nové heslo" required error={errors.password} hint={`Alespoň ${MIN_PASSWORD_LENGTH} znaků.`} shakeSignal={submitCount}>
                    {(controlProps) => (
                        <PasswordInput
                            {...controlProps}
                            autoComplete="new-password"
                            autoFocus
                            disabled={isSubmitting}
                            isVisible={isPasswordVisible}
                            onVisibleChange={setIsPasswordVisible}
                            value={values.password}
                            onChange={updateField("password")}
                        />
                    )}
                </FormField>
                <FormField id="reset-password-confirm" label="Nové heslo znovu" required error={errors.passwordConfirm} shakeSignal={submitCount}>
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
                {isSubmitting ? "Ukládám…" : "Uložit nové heslo"}
            </Button>
        </form>
    );
}

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const { isValidating, isValid } = useTokenValidation("/activation/validate-reset", token);

    return (
        <AuthLayout>
            {isValidating ? (
                <AuthMessage icon={IconLoader2} spin title="Ověřuji odkaz">
                    Chvíli strpení, kontrolujeme platnost odkazu pro obnovení hesla.
                </AuthMessage>
            ) : isValid ? (
                <ResetPasswordForm token={token} />
            ) : (
                <AuthMessage
                    icon={IconAlertCircle}
                    tone="danger"
                    title="Odkaz už neplatí"
                    action={<Button asChild size="lg"><Link to="/login">Přejít na přihlášení</Link></Button>}
                >
                    Odkaz pro obnovení hesla je neplatný nebo vypršel. Nový si můžete vyžádat na přihlašovací stránce přes „Zapomenuté heslo?“.
                </AuthMessage>
            )}
        </AuthLayout>
    );
}

export default ResetPassword;
