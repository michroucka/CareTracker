import {
    Input,
    NumberInput,
    Form,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import React from "react";
import { formatPostalCode } from "../../utils/formatters.js";
import { ReadOnlyField } from "../ReadOnlyField.jsx";

export const DepartmentForm = React.forwardRef(({
    initialData = null,
    onSubmit,
    isLoading = false,
    isReadOnly = false,
    employees = [],
    organizationId = null,
}, formRef) => {
    const [street, setStreet] = React.useState("");
    const [city, setCity] = React.useState("");
    const [postalCode, setPostalCode] = React.useState("");
    const [departmentNumber, setDepartmentNumber] = React.useState(null);
    const [coordinatorId, setCoordinatorId] = React.useState(null);
    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        if (initialData) {
            setStreet(initialData.street || "");
            setCity(initialData.city || "");
            setPostalCode(initialData.postalCode || "");
            setDepartmentNumber(initialData.departmentNumber ?? null);
            setCoordinatorId(initialData.coordinator?.id ?? initialData.coordinatorId ?? null);
        }
    }, [initialData]);

    const validateForm = () => {
        const newErrors = {};
        if (!street.trim()) newErrors.street = "Prosím zadejte ulici";
        if (!city.trim()) newErrors.city = "Prosím zadejte město";
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
            street,
            city,
            postalCode: postalCode || null,
            departmentNumber: departmentNumber || null,
            coordinatorId: coordinatorId || null,
            organizationId: organizationId || null,
        });
    };

    const resetForm = () => {
        setStreet("");
        setCity("");
        setPostalCode("");
        setDepartmentNumber(null);
        setCoordinatorId(null);
        setErrors({});
    };

    React.useImperativeHandle(formRef, () => ({
        submit: handleSubmit,
        reset: resetForm,
    }));

    const clearError = (field) => setErrors(prev => ({ ...prev, [field]: undefined }));

    const coordinatorName = employees.find(e => e.id === coordinatorId)?.fullName || null;

    return (
        <Form
            className="w-full space-y-4"
            validationErrors={errors}
            onReset={resetForm}
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-4 w-full">
                {isReadOnly ? (
                    <ReadOnlyField label="Ulice a číslo popisné" value={street} />
                ) : (
                    <Input
                        isRequired
                        isDisabled={isLoading}
                        isInvalid={!!errors.street}
                        errorMessage={errors.street}
                        label="Ulice a číslo popisné"
                        labelPlacement="inside"
                        name="street"
                        value={street}
                        onValueChange={(v) => { setStreet(v); clearError("street"); }}
                    />
                )}

                <div className="grid grid-cols-3 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Město" value={city} className="col-span-2" />
                    ) : (
                        <Input
                            isRequired
                            isDisabled={isLoading}
                            isInvalid={!!errors.city}
                            errorMessage={errors.city}
                            label="Město"
                            labelPlacement="inside"
                            name="city"
                            value={city}
                            onValueChange={(v) => { setCity(v); clearError("city"); }}
                            className="col-span-2"
                        />
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="PSČ" value={postalCode} />
                    ) : (
                        <Input
                            isDisabled={isLoading}
                            label="PSČ"
                            labelPlacement="inside"
                            name="postalCode"
                            value={postalCode}
                            onValueChange={(v) => setPostalCode(formatPostalCode(v))}
                            maxLength={6}
                            isRequired
                        />
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Číslo" value={departmentNumber} />
                    ) : (
                        <NumberInput
                            isDisabled={isLoading}
                            label="Číslo"
                            labelPlacement="inside"
                            name="departmentNumber"
                            value={departmentNumber}
                            onValueChange={setDepartmentNumber}
                            hideStepper
                            maxValue={99}
                            minValue={1}
                        />
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="Koordinátor" value={coordinatorName} className="col-span-2" />
                    ) : (
                        <Autocomplete
                            isDisabled={isLoading}
                            label="Koordinátor"
                            labelPlacement="inside"
                            name="coordinatorId"
                            selectedKey={coordinatorId ? coordinatorId.toString() : null}
                            onSelectionChange={(key) => setCoordinatorId(key ? parseInt(key) : null)}
                            className="col-span-2"
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
            </div>
        </Form>
    );
});

DepartmentForm.displayName = "DepartmentForm";
