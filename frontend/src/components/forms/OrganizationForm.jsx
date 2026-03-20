import {
    Input,
    Form,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import React from "react";
import { ReadOnlyField } from "../ReadOnlyField.jsx";

export const OrganizationForm = React.forwardRef(({
    initialData = null,
    onSubmit,
    isLoading = false,
    isReadOnly = false,
    employees = [],
}, formRef) => {
    const [name, setName] = React.useState("");
    const [managerId, setManagerId] = React.useState(null);
    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setManagerId(initialData.manager?.id ?? initialData.managerId ?? null);
        }
    }, [initialData]);

    const validateForm = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.street = "Prosím zadejte název";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        await onSubmit?.({
            name,
            managerId: managerId || null,
        });
    };

    const resetForm = () => {
        setName("");
        setManagerId(null);
        setErrors({});
    };

    React.useImperativeHandle(formRef, () => ({
        submit: handleSubmit,
        reset: resetForm,
    }));

    const clearError = (field) => setErrors(prev => ({ ...prev, [field]: undefined }));

    const managerName = employees.find(e => e.id === managerId)?.fullName || null;

    return (
        <Form
            className="w-full space-y-4"
            validationErrors={errors}
            onReset={resetForm}
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-4 w-full">
                {isReadOnly ? (
                    <ReadOnlyField label="Název" value={name} />
                ) : (
                    <Input
                        isRequired
                        isDisabled={isLoading}
                        isInvalid={!!errors.name}
                        errorMessage={errors.name}
                        label="Název"
                        labelPlacement="inside"
                        name="name"
                        value={name}
                        onValueChange={(v) => { setName(v); clearError("name"); }}
                    />
                )}

                {isReadOnly ? (
                    <ReadOnlyField label="Vedoucí" value={managerName} />
                ) : (
                    <Autocomplete
                        isDisabled={isLoading}
                        label="Vedoucí"
                        labelPlacement="inside"
                        name="managerId"
                        selectedKey={managerId ? managerId.toString() : null}
                        onSelectionChange={(key) => setManagerId(key ? parseInt(key) : null)}
                    >
                        {employees.map((emp) => (
                            <AutocompleteItem
                                key={emp.id.toString()}
                                value={emp.id.toString()}
                                textValue={emp.fullName}
                            >
                                {emp.fullName}
                            </AutocompleteItem>
                        ))}
                    </Autocomplete>
                )}
            </div>
        </Form>
    );
});

OrganizationForm.displayName = "OrganizationForm";
