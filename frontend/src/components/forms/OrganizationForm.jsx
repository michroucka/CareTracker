import {
    TextField,
    Input,
    Label,
    FieldError,
    Form,
    Autocomplete,
    SearchField,
    ListBox,
    useFilter,
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
    const {contains} = useFilter({sensitivity: "base"});

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
                    <TextField name="name" isRequired isInvalid={!!errors.name}>
                        <Label>Název</Label>
                        <Input
                            isDisabled={isLoading}
                            value={name}
                            onChange={(e) => { setName(e.target.value); clearError("name"); }}
                        />
                        <FieldError>{errors.name}</FieldError>
                    </TextField>
                )}

                {isReadOnly ? (
                    <ReadOnlyField label="Vedoucí" value={managerName} />
                ) : (
                    <Autocomplete
                        isDisabled={isLoading}
                        name="managerId"
                        value={managerId ? managerId.toString() : null}
                        onChange={(key) => setManagerId(key ? parseInt(key) : null)}
                    >
                        <Label>Vedoucí</Label>
                        <Autocomplete.Trigger>
                            <Autocomplete.Value />
                            <Autocomplete.ClearButton />
                            <Autocomplete.Indicator />
                        </Autocomplete.Trigger>
                        <Autocomplete.Popover>
                            <Autocomplete.Filter filter={contains}>
                                <SearchField>
                                    <SearchField.Group>
                                        <SearchField.SearchIcon />
                                        <SearchField.Input placeholder="Hledat..." />
                                    </SearchField.Group>
                                </SearchField>
                                <ListBox>
                                    {employees.map((emp) => (
                                        <ListBox.Item
                                            key={emp.id.toString()}
                                            id={emp.id.toString()}
                                            textValue={emp.fullName}
                                        >
                                            {emp.fullName}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Autocomplete.Filter>
                        </Autocomplete.Popover>
                    </Autocomplete>
                )}
            </div>
        </Form>
    );
});

OrganizationForm.displayName = "OrganizationForm";
