import React from "react";

/**
 * Shared state for record forms in sheets and dialogs: values, per-field errors, a submit counter
 * for FormField's shake and a pending flag.
 *
 * `submit(validate, save)` runs `validate(values)` (returns an errors object) and, when valid,
 * awaits `save(values)`. Returns true on success; errors from `save` keep the form open.
 */
export function useRecordForm(initialValues) {
    const [values, setValues] = React.useState(initialValues);
    const [errors, setErrors] = React.useState({});
    const [submitCount, setSubmitCount] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const setField = React.useCallback((field, value) => {
        setValues((previous) => ({ ...previous, [field]: value }));
        setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
    }, []);

    const reset = React.useCallback((nextValues) => {
        setValues(nextValues);
        setErrors({});
    }, []);

    const submit = async (validate, save) => {
        setSubmitCount((count) => count + 1);
        const nextErrors = validate(values);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return false;
        }
        setIsSubmitting(true);
        try {
            await save(values);
            return true;
        } catch {
            // hooks already show an error toast
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { values, errors, submitCount, isSubmitting, setField, reset, submit };
}
