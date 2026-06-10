import {
    TextField,
    Input,
    Label,
    FieldError,
    Checkbox,
    Select,
    ListBox,
    Form,
    NumberField,
} from "@heroui/react";
import React from "react";
import { ReadOnlyField } from "../ReadOnlyField.jsx";
import {unitTypeLabels, unitTypeOptions} from "../../constants/taskConstants.js";

/**
 * Reusable task form component used in both create and edit modals
 *
 * @param {Object} props
 * @param {Object} props.initialData - Initial form data (for edit mode)
 * @param {Function} props.onSubmit - Submit handler that receives validated form data
 * @param {boolean} props.isLoading - Loading state for form submission
 * @param {boolean} props.isReadOnly - Whether form is in read-only mode
 * @param {React.Ref} props.formRef - Ref for imperative form controls (reset, etc.)
 */
export const TaskForm = React.forwardRef(({
                                                  initialData = null,
                                                  onSubmit,
                                                  isLoading = false,
                                                  isReadOnly = false,
                                                  organizationId = null,
                                              }, formRef) => {
    const [name, setName] = React.useState("");
    const [unitPrice, setUnitPrice] = React.useState(null);
    const [unitType, setUnitType] = React.useState("HOUR");
    const [doubleMeeting, setDoubleMeeting] = React.useState(false);

    const [errors, setErrors] = React.useState({});

    // Initialize form with initial data
    React.useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setUnitPrice(initialData.unitPrice || null);
            setUnitType(initialData.unitType || "HOUR");
            setDoubleMeeting(initialData.doubleMeeting || false);
        }
    }, [initialData]);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!name.trim()) newErrors.name = "Prosím zadejte název";
        if (!unitPrice) newErrors.unitPrice = "Prosím zadejte cenu"

        return newErrors;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const formData = {
            name: name,
            unitPrice: unitPrice,
            unitType: unitType,
            doubleMeeting: doubleMeeting,
            organizationId: organizationId || null,
        };

        if (onSubmit) {
            await onSubmit(formData);
        }
    };

    // Reset form
    const resetForm = () => {
        setName("");
        setUnitPrice(null);
        setUnitType("HOUR");
        setDoubleMeeting(false);
        setErrors({});
    };

    // Expose imperative methods via ref
    React.useImperativeHandle(formRef, () => ({
        submit: handleSubmit,
        reset: resetForm,
    }));

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
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) {
                                    setErrors({ ...errors, name: undefined });
                                }
                            }}
                        />
                        <FieldError>{errors.name}</FieldError>
                    </TextField>
                )}

                <div className="grid grid-cols-3 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Cena" value={unitPrice} type="number" endContent="Kč" />
                    ) : (
                        <NumberField
                            name="unitPrice"
                            isRequired
                            isInvalid={!!errors.unitPrice}
                            isDisabled={isLoading}
                            value={unitPrice}
                            onChange={(value) => {
                                setUnitPrice(value);
                                if (errors.unitPrice) {
                                    setErrors({ ...errors, unitPrice: undefined });
                                }
                            }}
                        >
                            <Label>Cena</Label>
                            <NumberField.Group>
                                <NumberField.Input />
                                <span className="text-foreground/50 text-sm px-2 self-center">Kč</span>
                            </NumberField.Group>
                            <FieldError>{errors.unitPrice}</FieldError>
                        </NumberField>
                    )}
                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Jednotka"
                            value={unitTypeLabels[unitType]}
                        />
                    ) : (
                        <Select
                            isDisabled={isLoading}
                            isInvalid={!!errors.unitType}
                            name="unitType"
                            value={unitType}
                            onChange={setUnitType}
                            isRequired
                        >
                            <Label>Jednotka</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    {unitTypeOptions.map((type) => (
                                        <ListBox.Item key={type.key} id={type.key} textValue={type.name}>
                                            {type.name}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                            <FieldError>{errors.unitType}</FieldError>
                        </Select>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Dvojité setkání"
                            value={doubleMeeting ? 'Ano' : 'Ne'}
                        />
                    ) : (
                        <div className="flex items-center h-14">
                            <Checkbox
                                id="doubleMeeting"
                                isDisabled={isLoading}
                                isSelected={doubleMeeting}
                                onChange={setDoubleMeeting}
                            >
                                <Checkbox.Control>
                                    <Checkbox.Indicator />
                                </Checkbox.Control>
                                <Checkbox.Content>
                                    <Label htmlFor="doubleMeeting">Dvojité setkání</Label>
                                </Checkbox.Content>
                            </Checkbox>
                        </div>
                    )}
                </div>
            </div>
        </Form>
    );
});

TaskForm.displayName = "TaskForm";
