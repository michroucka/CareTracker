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
    Autocomplete,
    SearchField,
    useFilter, TextArea,
} from "@heroui/react";
import React, {useState} from "react";
import { CalendarDate, parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { formatPostalCode, formatPhoneNumber } from "../../utils/formatters.js";
import { benefitsOptions, terminationReasonOptions } from "../../constants/clientConstants.js";
import { ReadOnlyField } from "../ReadOnlyField.jsx";
import { ImageUpload } from "../ImageUpload.jsx";
import { AppDatePicker } from "../AppDatePicker.jsx";
import {MIN_YEAR} from "../../constants/globalConstants.js";

/**
 * Reusable client form component used in both create and edit modals
 *
 * @param {Object} props
 * @param {Object} props.initialData - Initial form data (for edit mode)
 * @param {Function} props.onSubmit - Submit handler that receives validated form data
 * @param {boolean} props.isLoading - Loading state for form submission
 * @param {boolean} props.isReadOnly - Whether form is in read-only mode
 * @param {Array} props.departments - List of departments
 * @param {Array} props.caregivers - List of caregivers
 * @param {Array} props.tasks - List of tasks
 * @param {number} props.userDept - Default department ID for current user (create mode)
 * @param {boolean} props.showTermination - Show termination fields (for inactive clients)
 * @param {React.Ref} props.formRef - Ref for imperative form controls (reset, etc.)
 */
export const ClientForm = React.forwardRef(({
    initialData = null,
    onSubmit,
    isLoading = false,
    isReadOnly = false,
    departments = [],
    caregivers = [],
    tasks = [],
    userDept = null,
    showTermination = false,
}, formRef) => {
    const [picture, setPicture] = useState(null);
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [gender, setGender] = React.useState("");
    const [personalNumber, setPersonalNumber] = React.useState(null);
    const [dateOfBirth, setDateOfBirth] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [street, setStreet] = React.useState("");
    const [city, setCity] = React.useState("");
    const [postalCode, setPostalCode] = React.useState("");
    const [legallyCompetent, setLegallyCompetent] = React.useState(true);
    const [benefits, setBenefits] = React.useState("NONE");
    const [relativesContact, setRelativesContact] = React.useState("");
    const [generalPractitioner, setGeneralPractitioner] = React.useState("");
    const [notes, setNotes] = React.useState("");
    const [departmentId, setDepartmentId] = React.useState(null);
    const [caregiverId, setCaregiverId] = React.useState(null);
    const [taskIds, setTaskIds] = React.useState([]);
    const [terminationDate, setTerminationDate] = React.useState(null);
    const [terminationReason, setTerminationReason] = React.useState("");

    const [errors, setErrors] = React.useState({});
    const {contains} = useFilter({sensitivity: "base"});

    // Initialize form with initial data
    React.useEffect(() => {
        if (initialData) {
            setPicture(initialData.picture || initialData.pictureUrl || null);
            setFirstName(initialData.firstName || "");
            setLastName(initialData.lastName || "");
            setGender(initialData.gender || "");
            setPersonalNumber(initialData.personalNumber || null);
            setDateOfBirth(initialData.dateOfBirth || "");
            setEmail(initialData.email || "");
            setPhone(initialData.phone || "");
            setStreet(initialData.street || "");
            setCity(initialData.city || "");
            setPostalCode(initialData.postalCode || "");
            setLegallyCompetent(initialData.legallyCompetent ?? true);
            setBenefits(initialData.benefits || "NONE");
            setRelativesContact(initialData.relativesContact || "");
            setGeneralPractitioner(initialData.generalPractitioner || "");
            setNotes(initialData.notes || "");
            setDepartmentId(initialData.department?.id || initialData.departmentId || null);
            setCaregiverId(initialData.caregiver?.id || initialData.caregiverId || null);
            setTaskIds(initialData.tasks?.map(t => t.id) || initialData.taskIds || []);
            setTerminationDate(initialData.terminationDate || null);
            setTerminationReason(initialData.terminationReason || "");
        }
    }, [initialData]);

    // Set default department for create mode
    React.useEffect(() => {
        if (userDept && departments.length > 0 && !departmentId && !initialData) {
            setDepartmentId(userDept);
        }
    }, [userDept, departments, departmentId, initialData]);

    // Filter caregivers by selected department
    const filteredCaregivers = React.useMemo(() => {
        if (!departmentId) {
            return caregivers;
        }
        return caregivers.filter(caregiver =>
            caregiver.department?.id === departmentId
        );
    }, [caregivers, departmentId]);

    // Reset caregiverId if selected caregiver is not in filtered list
    React.useEffect(() => {
        if (caregiverId && !filteredCaregivers.find(cg => cg.id === caregiverId)) {
            setCaregiverId(null);
        }
    }, [caregiverId, filteredCaregivers]);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!firstName.trim()) newErrors.firstName = "Prosím zadejte jméno";
        if (!lastName.trim()) newErrors.lastName = "Prosím zadejte příjmení";
        if (!gender) newErrors.gender = "Prosím vyberte pohlaví";
        if (!dateOfBirth) newErrors.dateOfBirth = "Prosím zadejte datum narození";
        if (!departmentId) newErrors.departmentId = "Prosím vyberte středisko";
        if (!caregiverId) newErrors.caregiverId = "Prosím vyberte pečovatele";
        if (!street) newErrors.street = "Prosím zadejte ulici a číslo popisné";
        if (!city) newErrors.city = "Prosím zadejte město";
        if (!postalCode) newErrors.postalCode = "Prosím zadejte PSČ";

        // Termination fields (for inactive clients)
        if (showTermination) {
            if (!terminationDate) newErrors.terminationDate = "Prosím zadejte datum ukončení smlouvy";
            if (!terminationReason) newErrors.terminationReason = "Prosím zadejte důvod ukončení smlouvy";
        }

        // Email validation
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = "Prosím zadejte platnou emailovou adresu";
            }
        }

        // Phone validation
        if (phone && phone.trim()) {
            const phoneWithPlus = /^\+\d{3} \d{3} \d{3} \d{3}$/;
            const phoneWithoutPlus = /^\d{3} \d{3} \d{3}$/;
            if (!phoneWithPlus.test(phone) && !phoneWithoutPlus.test(phone)) {
                newErrors.phone = "Neplatný formát telefonu";
            }
        }

        // Postal code validation
        if (postalCode && postalCode.trim()) {
            const postalCodeRegex = /^\d{3} \d{2}$/;
            if (!postalCodeRegex.test(postalCode)) {
                newErrors.postalCode = "Neplatný formát PSČ";
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
            picture: picture || null,
            firstName,
            lastName,
            gender,
            personalNumber: personalNumber || null,
            dateOfBirth,
            email: email || null,
            phone: phone || null,
            street,
            city,
            postalCode,
            legallyCompetent,
            benefits,
            relativesContact: relativesContact || null,
            generalPractitioner: generalPractitioner || null,
            notes: notes || null,
            departmentId,
            caregiverId,
            taskIds: taskIds || [],
            terminationDate: terminationDate || null,
            terminationReason: terminationReason || null,
        };

        if (onSubmit) {
            await onSubmit(formData);
        }
    };

    // Reset form
    const resetForm = () => {
        setPicture(null);
        setFirstName("");
        setLastName("");
        setGender("");
        setPersonalNumber(null);
        setDateOfBirth("");
        setEmail("");
        setPhone("");
        setStreet("");
        setCity("");
        setPostalCode("");
        setLegallyCompetent(true);
        setBenefits("NONE");
        setRelativesContact("");
        setGeneralPractitioner("");
        setNotes("");
        setDepartmentId(null);
        setCaregiverId(null);
        setTaskIds([]);
        setTerminationDate(null);
        setTerminationReason("");
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
                {/* Profile Picture */}
                <ImageUpload
                    value={picture}
                    onChange={setPicture}
                    isDisabled={isLoading}
                    isReadOnly={isReadOnly}
                />

                {/* Basic Information */}
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
                            label="Pohlaví"
                            value={gender === 'MALE' ? 'Muž' : gender === 'FEMALE' ? 'Žena' : '-'}
                        />
                    ) : (
                        <Select
                            isDisabled={isLoading}
                            isInvalid={!!errors.gender}
                            name="gender"
                            value={gender || null}
                            onChange={(value) => {
                                setGender(value);
                                if (errors.gender) {
                                    setErrors({ ...errors, gender: undefined });
                                }
                            }}
                            isRequired
                        >
                            <Label>Pohlaví</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    <ListBox.Item id="MALE" textValue="Muž">
                                        Muž
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                    <ListBox.Item id="FEMALE" textValue="Žena">
                                        Žena
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                </ListBox>
                            </Select.Popover>
                            <FieldError>{errors.gender}</FieldError>
                        </Select>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Datum narození"
                            value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('cs-CZ') : '-'}
                        />
                    ) : (
                        <AppDatePicker
                            isDisabled={isLoading}
                            isInvalid={!!errors.dateOfBirth}
                            errorMessage={errors.dateOfBirth}
                            label="Datum narození"
                            name="dateOfBirth"
                            value={dateOfBirth ? parseDate(dateOfBirth) : null}
                            onChange={(date) => {
                                setDateOfBirth(date ? date.toString() : "");
                                if (errors.dateOfBirth) {
                                    setErrors({ ...errors, dateOfBirth: undefined });
                                }
                            }}
                            placeholderValue={new CalendarDate(1960, 1, 1)}
                            minValue={new CalendarDate(MIN_YEAR, 1, 1)}
                            maxValue={today(getLocalTimeZone())}
                            isRequired
                        />
                    )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
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

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Klíčový pracovník"
                            value={
                                caregivers.find(c => c.id === caregiverId)?.fullName || '-'
                            }
                        />
                    ) : (
                        <Autocomplete
                            isRequired
                            isDisabled={isLoading || !departmentId}
                            isInvalid={!!errors.caregiverId}
                            name="caregiverId"
                            value={caregiverId ? caregiverId.toString() : null}
                            onChange={(key) => {
                                setCaregiverId(key ? parseInt(key) : null);
                                if (errors.caregiverId) {
                                    setErrors({ ...errors, caregiverId: undefined });
                                }
                            }}
                        >
                            <Label>Klíčový pracovník</Label>
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
                                        {filteredCaregivers.map((caregiver) => (
                                            <ListBox.Item
                                                key={caregiver.id.toString()}
                                                id={caregiver.id.toString()}
                                                textValue={caregiver.fullName}
                                            >
                                                {caregiver.fullName}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Autocomplete.Filter>
                            </Autocomplete.Popover>
                            <FieldError>{errors.caregiverId}</FieldError>
                        </Autocomplete>
                    )}
                </div>

                {/* Address */}
                {isReadOnly ? (
                    <ReadOnlyField label="Ulice a číslo popisné" value={street} />
                ) : (
                    <TextField name="street" isRequired isInvalid={!!errors.street}>
                        <Label>Ulice a číslo popisné</Label>
                        <Input
                            isDisabled={isLoading}
                            value={street}
                            onChange={(e) => {
                                setStreet(e.target.value);
                                if (errors.street) {
                                    setErrors({ ...errors, street: undefined });
                                }
                            }}
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
                                onChange={(e) => {
                                    setCity(e.target.value);
                                    if (errors.city) {
                                        setErrors({ ...errors, city: undefined });
                                    }
                                }}
                            />
                            <FieldError>{errors.city}</FieldError>
                        </TextField>
                    )}
                    {isReadOnly ? (
                        <ReadOnlyField label="PSČ" value={postalCode} />
                    ) : (
                        <TextField name="postalCode" isRequired isInvalid={!!errors.postalCode}>
                            <Label>PSČ</Label>
                            <Input
                                isDisabled={isLoading}
                                value={postalCode}
                                maxLength={6}
                                onChange={(e) => {
                                    setPostalCode(formatPostalCode(e.target.value));
                                    if (errors.postalCode) {
                                        setErrors({ ...errors, postalCode: undefined });
                                    }
                                }}
                            />
                            <FieldError>{errors.postalCode}</FieldError>
                        </TextField>
                    )}
                </div>

                <div className="flex gap-4 items-start">
                    {isReadOnly ? (
                        <ReadOnlyField label="Email" value={email} />
                    ) : (
                        <TextField name="email" isInvalid={!!errors.email} className="flex-1">
                            <Label>Email</Label>
                            <Input
                                isDisabled={isLoading}
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
                        <ReadOnlyField label="Svéprávný" value={legallyCompetent ? 'Ano' : 'Ne'} />
                    ) : (
                        <div className="flex flex-col gap-1">
                            <Label className="invisible pointer-events-none select-none" aria-hidden="true">&nbsp;</Label>
                            <div className="flex items-center h-9">
                                <Checkbox
                                    id="legallyCompetent"
                                    isSelected={legallyCompetent}
                                    onChange={setLegallyCompetent}
                                    isDisabled={isLoading}
                                >
                                    <Checkbox.Control>
                                        <Checkbox.Indicator />
                                    </Checkbox.Control>
                                    <Checkbox.Content>
                                        <Label htmlFor="legallyCompetent">Svéprávný</Label>
                                    </Checkbox.Content>
                                </Checkbox>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Telefon" value={phone} />
                    ) : (
                        <TextField name="phone" isInvalid={!!errors.phone}>
                            <Label>Telefon</Label>
                            <Input
                                isDisabled={isLoading}
                                type="tel"
                                value={phone}
                                maxLength={17}
                                onChange={(e) => {
                                    setPhone(formatPhoneNumber(e.target.value));
                                    if (errors.phone) {
                                        setErrors({ ...errors, phone: undefined });
                                    }
                                }}
                            />
                            <FieldError>{errors.phone}</FieldError>
                        </TextField>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="Osobní číslo" value={personalNumber} />
                    ) : (
                        <NumberField
                            fullWidth
                            minValue={0}
                            name="personalNumber"
                            isDisabled={isLoading}
                            value={personalNumber}
                            onChange={setPersonalNumber}
                        >
                            <Label>Osobní číslo</Label>
                            <NumberField.Group>
                                <NumberField.Input className="w-64" />
                            </NumberField.Group>
                            <FieldError />
                        </NumberField>
                    )}
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Příspěvek na péči"
                            value={benefitsOptions.find(b => b.key === benefits)?.name || '-'}
                        />
                    ) : (
                        <Select
                            isDisabled={isLoading}
                            name="benefits"
                            value={benefits}
                            onChange={setBenefits}
                        >
                            <Label>Příspěvek na péči</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    {benefitsOptions.map((b) => (
                                        <ListBox.Item key={b.key} id={b.key} textValue={b.name}>
                                            {b.name}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Úkony"
                            value={
                                taskIds.length > 0
                                    ? `Celkem: ${taskIds.length}`
                                    : '-'
                            }
                        />
                    ) : (
                        <Select
                            isDisabled={isLoading}
                            name="taskIds"
                            selectionMode="multiple"
                            value={taskIds.map(id => id.toString())}
                            onChange={(keys) => {
                                const selectedIds = keys.map(key => parseInt(key));
                                setTaskIds(selectedIds);
                            }}
                        >
                            <Label>Úkony</Label>
                            <Select.Trigger>
                                <Select.Value>
                                    {() => `Celkem: ${taskIds.length}`}
                                </Select.Value>
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    {tasks.map((task) => (
                                        <ListBox.Item
                                            key={task.id.toString()}
                                            id={task.id.toString()}
                                            textValue={task.name}
                                        >
                                            {task.name}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                    )}
                </div>

                {isReadOnly ? (
                    <ReadOnlyField multiline label="Kontakt na příbuzné" value={relativesContact} />
                ) : (
                    <div className="flex flex-col gap-1 w-full">
                        <Label>Kontakt na příbuzné</Label>
                        <TextArea
                            disabled={isLoading}
                            name="relativesContact"
                            value={relativesContact}
                            onChange={(e) => setRelativesContact(e.target.value)}
                            className="field-sizing-content"
                        />
                    </div>
                )}

                {isReadOnly ? (
                    <ReadOnlyField multiline label="Praktický lékař" value={generalPractitioner} />
                ) : (
                    <div className="flex flex-col gap-1 w-full">
                        <Label>Praktický lékař</Label>
                        <TextArea
                            disabled={isLoading}
                            name="generalPractitioner"
                            value={generalPractitioner}
                            onChange={(e) => setGeneralPractitioner(e.target.value)}
                            className="field-sizing-content"
                        />
                    </div>
                )}

                {isReadOnly ? (
                    <ReadOnlyField multiline label="Poznámky" value={notes} />
                ) : (
                    <div className="flex flex-col gap-1 w-full">
                        <Label>Poznámky</Label>
                        <TextArea
                            disabled={isLoading}
                            name="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="field-sizing-content"
                        />
                    </div>
                )}

                {/* Termination fields (only for inactive clients) */}
                {showTermination && (
                    <>
                        {isReadOnly ? (
                            <ReadOnlyField
                                label="Datum ukončení smlouvy"
                                value={terminationDate ? new Date(terminationDate).toLocaleDateString('cs-CZ') : '-'}
                            />
                        ) : (
                            <AppDatePicker
                                isInvalid={!!errors.terminationDate}
                                errorMessage={errors.terminationDate}
                                label="Datum ukončení smlouvy"
                                name="terminationDate"
                                value={terminationDate ? parseDate(terminationDate) : null}
                                onChange={(date) => {
                                    setTerminationDate(date ? date.toString() : "");
                                    if (errors.terminationDate) {
                                        setErrors({ ...errors, terminationDate: undefined });
                                    }
                                }}
                                minValue={new CalendarDate(MIN_YEAR, 1, 1)}
                                maxValue={today(getLocalTimeZone())}
                                isRequired
                                isDisabled={isLoading}
                            />
                        )}

                        {isReadOnly ? (
                            <ReadOnlyField
                                label="Důvod ukončení smlouvy"
                                value={terminationReasonOptions.find(r => r.key === terminationReason)?.name || '-'}
                            />
                        ) : (
                            <Select
                                isInvalid={!!errors.terminationReason}
                                name="terminationReason"
                                value={terminationReason || null}
                                onChange={(value) => {
                                    setTerminationReason(value);
                                    if (errors.terminationReason) {
                                        setErrors({ ...errors, terminationReason: undefined });
                                    }
                                }}
                                isRequired
                                isDisabled={isLoading}
                            >
                                <Label>Důvod ukončení smlouvy</Label>
                                <Select.Trigger>
                                    <Select.Value />
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox>
                                        {terminationReasonOptions.map((reason) => (
                                            <ListBox.Item key={reason.key} id={reason.key} textValue={reason.name}>
                                                {reason.name}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                                <FieldError>{errors.terminationReason}</FieldError>
                            </Select>
                        )}
                    </>
                )}
            </div>
        </Form>
    );
});

ClientForm.displayName = "ClientForm";
