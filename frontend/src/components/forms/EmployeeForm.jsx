import {
    Input,
    Checkbox,
    Select,
    SelectItem,
    Textarea,
    DatePicker,
    Form,
    NumberInput,
    Autocomplete,
    AutocompleteItem, Tooltip,
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
        if (!departmentId) newErrors.departmentId = "Prosím vyberte oddělení";

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
            email,
            isAdmin
        };

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
                        <Input
                            isDisabled={isLoading}
                            isInvalid={!!errors.firstName}
                            errorMessage={errors.firstName}
                            label="Jméno"
                            labelPlacement="inside"
                            name="firstName"
                            value={firstName}
                            onValueChange={(value) => {
                                setFirstName(value);
                                if (errors.firstName) {
                                    setErrors({ ...errors, firstName: undefined });
                                }
                            }}
                            isRequired
                        />
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="Příjmení" value={lastName} />
                    ) : (
                        <Input
                            isDisabled={isLoading}
                            isInvalid={!!errors.lastName}
                            errorMessage={errors.lastName}
                            label="Příjmení"
                            labelPlacement="inside"
                            name="lastName"
                            value={lastName}
                            onValueChange={(value) => {
                                setLastName(value);
                                if (errors.lastName) {
                                    setErrors({ ...errors, lastName: undefined });
                                }
                            }}
                            isRequired
                        />
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
                            errorMessage={errors.role}
                            label="Role"
                            labelPlacement="inside"
                            name="role"
                            selectedKeys={role ? [role] : []}
                            onSelectionChange={(keys) => {
                                setRole(Array.from(keys)[0]);
                                if (errors.role) {
                                    setErrors({ ...errors, role: undefined });
                                }
                            }}
                            isRequired
                            disallowEmptySelection
                        >
                            <SelectItem key="CAREGIVER" value="CAREGIVER">Pečovatel</SelectItem>
                            {userIsAdmin && (
                                <>
                                    <SelectItem key="COORDINATOR" value="COORDINATOR">Koordinátor</SelectItem>
                                    <SelectItem key="MANAGER" value="MANAGER">Vedoucí</SelectItem>
                                </>
                            )}
                        </Select>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Středisko"
                            value={departments.find(d => d.id === departmentId)?.name || '-'}
                        />
                    ) : (
                        <Select
                            isRequired
                            isDisabled={isLoading}
                            isInvalid={!!errors.departmentId}
                            errorMessage={errors.departmentId}
                            label="Středisko"
                            labelPlacement="inside"
                            name="departmentId"
                            selectedKeys={departmentId ? [departmentId.toString()] : []}
                            onSelectionChange={(keys) => {
                                const selectedId = Array.from(keys)[0];
                                setDepartmentId(selectedId ? parseInt(selectedId) : null);
                                if (errors.departmentId) {
                                    setErrors({ ...errors, departmentId: undefined });
                                }
                            }}
                        >
                            {departments.map((dept) => (
                                <SelectItem
                                    key={dept.id.toString()}
                                    value={dept.id.toString()}
                                    textValue={dept.name}
                                >
                                    {dept.name}
                                </SelectItem>
                            ))}
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
                        <Input
                            isRequired={!doNotCreateAccount}
                            isDisabled={isLoading || doNotCreateAccount}
                            isInvalid={!!errors.email}
                            errorMessage={errors.email}
                            label="Email"
                            labelPlacement="inside"
                            name="email"
                            type="email"
                            value={email}
                            onValueChange={(value) => {
                                setEmail(value);
                                if (errors.email) {
                                    setErrors({ ...errors, email: undefined });
                                }
                            }}
                            className="flex-1"
                        />
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Administrátor"
                            value={isAdmin ? 'Ano' : 'Ne'}
                        />
                    ) : (
                        <div className="flex items-center h-14">
                            <Checkbox
                                isDisabled={isLoading || doNotCreateAccount || !userIsAdmin}
                                isSelected={isAdmin}
                                onValueChange={setIsAdmin}
                                name="isAdmin"
                            >
                                Administrátor
                            </Checkbox>
                        </div>
                    )}
                </div>

                {!isReadOnly && !initialData?.email ? (
                    <Checkbox
                        isDisabled={isLoading}
                        isSelected={doNotCreateAccount}
                        onValueChange={setDoNotCreateAccount}
                        name="doNotCreateAccount"
                    >
                        Nevytvářet uživatelský účet
                    </Checkbox>
                ) : null}
            </div>
        </Form>
    );
});

EmployeeForm.displayName = "EmployeeForm";
