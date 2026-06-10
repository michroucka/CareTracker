import {
    TextField,
    Input,
    Label,
    FieldError,
    Checkbox,
    Select,
    ListBox,
    Form,
} from "@heroui/react";
import React from "react";
import { ReadOnlyField } from "../ReadOnlyField.jsx";
import { getRoleLabel } from "../../constants/roles.js";

/**
 * Reusable employee form component used in both create and edit modals
 *
 * @param {Object} props
 * @param {Object} props.initialData - Initial form data (for edit mode)
 * @param {Function} props.onSubmit - Submit handler that receives validated form data
 * @param {boolean} props.isLoading - Loading state for form submission
 * @param {boolean} props.isReadOnly - Whether form is in read-only mode
 * @param {Array} props.departments - List of departments
 * @param {number} props.userDept - Default department ID for current user (create mode)
 * @param {React.Ref} props.formRef - Ref for imperative form controls (reset, etc.)
 */
export const EmployeeForm = React.forwardRef(({
                                                initialData = null,
                                                onSubmit,
                                                isLoading = false,
                                                isReadOnly = false,
                                                departments = [],
                                                userDept = null,
                                                userRole = null,
                                            }, formRef) => {
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [role, setRole] = React.useState("CAREGIVER");
    const [departmentId, setDepartmentId] = React.useState(null);
    const [email, setEmail] = React.useState("");
    const [isAdmin, setIsAdmin] = React.useState(false);

    const [doNotCreateAccount, setDoNotCreateAccount] = React.useState(false);

    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        if (doNotCreateAccount) {
            setEmail("");
            setIsAdmin(false);
        }
    }, [doNotCreateAccount]);

    const userIsAdmin = ["ADMIN", "SUPERADMIN"].includes(userRole);

    // Initialize form with initial data
    React.useEffect(() => {
        if (initialData) {
            setFirstName(initialData.firstName || "");
            setLastName(initialData.lastName || "");
            setRole(initialData.role || "CAREGIVER");
            setDepartmentId(initialData.department?.id || initialData.departmentId || null);
            setEmail(initialData.email || "");
            setIsAdmin(initialData.isAdmin || false);

            setDoNotCreateAccount(!initialData.email);
        }
    }, [initialData]);

    // Set default department for create mode
    React.useEffect(() => {
        if (userDept && departments.length > 0 && !departmentId) {
            setDepartmentId(userDept);
        }
    }, [userDept, departments, departmentId, initialData]);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!firstName.trim()) newErrors.firstName = "Prosím zadejte jméno";
        if (!lastName.trim()) newErrors.lastName = "Prosím zadejte příjmení";
        if (!role.trim()) newErrors.role = "Prosím zadejte roli";
        if (!departmentId) newErrors.departmentId = "Prosím vyberte středisko";

        if (!doNotCreateAccount) {
            if (!email.trim()) newErrors.email = "Prosím zadejte email";
        }

        // Email validation
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = "Prosím zadejte platnou emailovou adresu";
            }
        }

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
            firstName,
            lastName,
            role,
            departmentId,
        };

        if (!doNotCreateAccount) {
            formData.email = email;
            formData.isAdmin = isAdmin;
        }

        if (onSubmit) {
            await onSubmit(formData);
        }
    };

    // Reset form
    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setRole("CAREGIVER");
        setDepartmentId(null);
        setEmail("");
        setIsAdmin(false);
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
                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Jméno" value={firstName} />
                    ) : (
                        <TextField name="firstName" isRequired isInvalid={!!errors.firstName}>
                            <Label>Jméno</Label>
                            <Input
                                isDisabled={isLoading}
                                value={firstName}
                                onChange={(e) => {
                                    setFirstName(e.target.value);
                                    if (errors.firstName) {
                                        setErrors({ ...errors, firstName: undefined });
                                    }
                                }}
                            />
                            <FieldError>{errors.firstName}</FieldError>
                        </TextField>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="Příjmení" value={lastName} />
                    ) : (
                        <TextField name="lastName" isRequired isInvalid={!!errors.lastName}>
                            <Label>Příjmení</Label>
                            <Input
                                isDisabled={isLoading}
                                value={lastName}
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                    if (errors.lastName) {
                                        setErrors({ ...errors, lastName: undefined });
                                    }
                                }}
                            />
                            <FieldError>{errors.lastName}</FieldError>
                        </TextField>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Role"
                            value={getRoleLabel(role)}
                        />
                    ) : (
                        <Select
                            isDisabled={isLoading}
                            isInvalid={!!errors.role}
                            name="role"
                            value={role}
                            onChange={(value) => {
                                setRole(value);
                                if (errors.role) {
                                    setErrors({ ...errors, role: undefined });
                                }
                            }}
                            isRequired
                        >
                            <Label>Role</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    <ListBox.Item id="CAREGIVER" textValue="Pečovatel">
                                        Pečovatel
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                    {userIsAdmin && (
                                        <>
                                            <ListBox.Item id="COORDINATOR" textValue="Koordinátor">
                                                Koordinátor
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                            <ListBox.Item id="MANAGER" textValue="Vedoucí">
                                                Vedoucí
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        </>
                                    )}
                                </ListBox>
                            </Select.Popover>
                            <FieldError>{errors.role}</FieldError>
                        </Select>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Středisko"
                            value={departments.find(d => d.id === departmentId)?.city || '-'}
                        />
                    ) : (
                        <Select
                            isRequired
                            isDisabled={isLoading}
                            isInvalid={!!errors.departmentId}
                            name="departmentId"
                            value={departmentId ? departmentId.toString() : null}
                            onChange={(value) => {
                                setDepartmentId(value ? parseInt(value) : null);
                                if (errors.departmentId) {
                                    setErrors({ ...errors, departmentId: undefined });
                                }
                            }}
                        >
                            <Label>Středisko</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    {departments.map((dept) => (
                                        <ListBox.Item
                                            key={dept.id.toString()}
                                            id={dept.id.toString()}
                                            textValue={dept.city}
                                        >
                                            {dept.city}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                            <FieldError>{errors.departmentId}</FieldError>
                        </Select>
                    )}
                </div>

                <div className="flex gap-4 items-start">
                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Email"
                            value={email}
                        />
                    ) : (
                        <TextField name="email" isRequired={!doNotCreateAccount} isInvalid={!!errors.email} className="flex-1">
                            <Label>Email</Label>
                            <Input
                                isDisabled={isLoading || doNotCreateAccount}
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) {
                                        setErrors({ ...errors, email: undefined });
                                    }
                                }}
                            />
                            <FieldError>{errors.email}</FieldError>
                        </TextField>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Administrátor"
                            value={isAdmin ? 'Ano' : 'Ne'}
                        />
                    ) : (
                        <div className="flex items-center h-14">
                            <Checkbox
                                id="isAdmin"
                                isDisabled={isLoading || doNotCreateAccount || !userIsAdmin}
                                isSelected={isAdmin}
                                onChange={setIsAdmin}
                            >
                                <Checkbox.Control>
                                    <Checkbox.Indicator />
                                </Checkbox.Control>
                                <Checkbox.Content>
                                    <Label htmlFor="isAdmin">Administrátor</Label>
                                </Checkbox.Content>
                            </Checkbox>
                        </div>
                    )}
                </div>

                {!isReadOnly && !initialData?.email ? (
                    <Checkbox
                        id="doNotCreateAccount"
                        isDisabled={isLoading}
                        isSelected={doNotCreateAccount}
                        onChange={setDoNotCreateAccount}
                    >
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                            <Label htmlFor="doNotCreateAccount">Nevytvářet uživatelský účet</Label>
                        </Checkbox.Content>
                    </Checkbox>
                ) : null}
            </div>
        </Form>
    );
});

EmployeeForm.displayName = "EmployeeForm";
