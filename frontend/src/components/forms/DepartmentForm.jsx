import {
    TextField,
    Input,
    Label,
    FieldError,
    NumberField,
    Form,
    Autocomplete,
    SearchField,
    ListBox,
    useFilter,
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
    const {contains} = useFilter({sensitivity: "base"});

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
                    <TextField name="street" isRequired isInvalid={!!errors.street}>
                        <Label>Ulice a číslo popisné</Label>
                        <Input
                            isDisabled={isLoading}
                            value={street}
                            onChange={(e) => { setStreet(e.target.value); clearError("street"); }}
                        />
                        <FieldError>{errors.street}</FieldError>
                    </TextField>
                )}

                <div className="grid grid-cols-3 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Město" value={city} className="col-span-2" />
                    ) : (
                        <TextField name="city" isRequired isInvalid={!!errors.city} className="col-span-2">
                            <Label>Město</Label>
                            <Input
                                isDisabled={isLoading}
                                value={city}
                                onChange={(e) => { setCity(e.target.value); clearError("city"); }}
                            />
                            <FieldError>{errors.city}</FieldError>
                        </TextField>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="PSČ" value={postalCode} />
                    ) : (
                        <TextField name="postalCode" isRequired>
                            <Label>PSČ</Label>
                            <Input
                                isDisabled={isLoading}
                                value={postalCode}
                                onChange={(e) => setPostalCode(formatPostalCode(e.target.value))}
                                maxLength={6}
                            />
                            <FieldError />
                        </TextField>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Číslo" value={departmentNumber} />
                    ) : (
                        <NumberField
                            name="departmentNumber"
                            isDisabled={isLoading}
                            value={departmentNumber}
                            onChange={setDepartmentNumber}
                            maxValue={99}
                            minValue={1}
                        >
                            <Label>Číslo</Label>
                            <NumberField.Group>
                                <NumberField.Input />
                            </NumberField.Group>
                            <FieldError />
                        </NumberField>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="Koordinátor" value={coordinatorName} className="col-span-2" />
                    ) : (
                        <Autocomplete
                            isDisabled={isLoading}
                            name="coordinatorId"
                            value={coordinatorId ? coordinatorId.toString() : null}
                            onChange={(key) => setCoordinatorId(key ? parseInt(key) : null)}
                            className="col-span-2"
                        >
                            <Label>Koordinátor</Label>
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
            </div>
        </Form>
    );
});

DepartmentForm.displayName = "DepartmentForm";
