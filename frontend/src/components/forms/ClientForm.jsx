import {
    Button,
    Input,
    Checkbox,
    Select,
    SelectItem,
    Textarea,
    DatePicker,
    Form,
    NumberInput,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import { CalendarDays, Map as MapIcon } from "lucide-react";
import React, {useState} from "react";
import { CalendarDate, parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { formatPostalCode, formatPhoneNumber } from "../../utils/formatters.js";
import { benefitsOptions, terminationReasonOptions } from "../../constants/clientConstants.js";
import { ReadOnlyField } from "../ReadOnlyField.jsx";
import { ImageUpload } from "../ImageUpload.jsx";
import { MapModal } from "../modals/MapModal.jsx";
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
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

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
        <>
        <Form
            className="w-full max-w-xl mx-auto space-y-4 "
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
                            label="Pohlaví"
                            value={gender === 'MALE' ? 'Muž' : gender === 'FEMALE' ? 'Žena' : '-'}
                        />
                    ) : (
                        <Select
                            isDisabled={isLoading}
                            isInvalid={!!errors.gender}
                            errorMessage={errors.gender}
                            label="Pohlaví"
                            labelPlacement="inside"
                            name="gender"
                            selectedKeys={gender ? [gender] : []}
                            onSelectionChange={(keys) => {
                                setGender(Array.from(keys)[0]);
                                if (errors.gender) {
                                    setErrors({ ...errors, gender: undefined });
                                }
                            }}
                            isRequired
                        >
                            <SelectItem key="MALE" value="MALE">Muž</SelectItem>
                            <SelectItem key="FEMALE" value="FEMALE">Žena</SelectItem>
                        </Select>
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Datum narození"
                            value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('cs-CZ') : '-'}
                        />
                    ) : (
                        <DatePicker
                            isDisabled={isLoading}
                            isInvalid={!!errors.dateOfBirth}
                            errorMessage={errors.dateOfBirth}
                            label="Datum narození"
                            labelPlacement="inside"
                            name="dateOfBirth"
                            value={dateOfBirth ? parseDate(dateOfBirth) : null}
                            onChange={(date) => {
                                setDateOfBirth(date ? date.toString() : "");
                                if (errors.dateOfBirth) {
                                    setErrors({ ...errors, dateOfBirth: undefined });
                                }
                            }}
                            showMonthAndYearPickers
                            selectorIcon={<CalendarDays size={18}/>}
                            placeholderValue={new CalendarDate(1960, 1, 1)}
                            minValue={new CalendarDate(MIN_YEAR, 1, 1)}
                            maxValue={today(getLocalTimeZone())}
                            isRequired
                            classNames={{
                                segment: "text-default-500"
                            }}
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                                    textValue={dept.city}
                                >
                                    {dept.city}
                                </SelectItem>
                            ))}
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
                            errorMessage={errors.caregiverId}
                            label="Klíčový pracovník"
                            labelPlacement="inside"
                            name="caregiverId"
                            selectedKey={caregiverId ? caregiverId.toString() : null}
                            onSelectionChange={(key) => {
                                setCaregiverId(key ? parseInt(key) : null);
                                if (errors.caregiverId) {
                                    setErrors({ ...errors, caregiverId: undefined });
                                }
                            }}
                        >
                            {filteredCaregivers.map((caregiver) => {
                                const caregiverName = caregiver.fullName;
                                return (
                                    <AutocompleteItem
                                        key={caregiver.id.toString()}
                                        value={caregiver.id.toString()}
                                        textValue={caregiverName}
                                    >
                                        {caregiverName}
                                    </AutocompleteItem>
                                );
                            })}
                        </Autocomplete>
                    )}
                </div>

                {/* Address */}
                {isReadOnly ? (
                    <ReadOnlyField
                        label="Ulice a číslo popisné"
                        value={street}
                        endContent={
                            initialData?.latitude != null && initialData?.longitude != null ? (
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setIsMapModalOpen(true)}
                                    className="ms-2"
                                >
                                    <MapIcon className="size-5" />
                                </Button>
                            ) : null
                        }
                    />
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
                        onValueChange={(value) => {
                            setStreet(value);
                            if (errors.street) {
                                setErrors({ ...errors, street: undefined });
                            }
                        }}
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
                            onValueChange={(value) => {
                                setCity(value);
                                if (errors.city) {
                                    setErrors({ ...errors, city: undefined });
                                }
                            }}
                            className="col-span-2"
                        />
                    )}
                    {isReadOnly ? (
                        <ReadOnlyField label="PSČ" value={postalCode} />
                    ) : (
                        <Input
                            isRequired
                            isDisabled={isLoading}
                            isInvalid={!!errors.postalCode}
                            errorMessage={errors.postalCode}
                            label="PSČ"
                            labelPlacement="inside"
                            name="postalCode"
                            value={postalCode}
                            onValueChange={(value) => {
                                setPostalCode(formatPostalCode(value));
                                if (errors.postalCode) {
                                    setErrors({ ...errors, postalCode: undefined });
                                }
                            }}
                            maxLength={6}
                        />
                    )}
                </div>

                <div className="flex gap-4 items-start">
                    {isReadOnly ? (
                        <ReadOnlyField label="Email" value={email} />
                    ) : (
                        <Input
                            isDisabled={isLoading}
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
                        <ReadOnlyField label="Svéprávný" value={legallyCompetent ? 'Ano' : 'Ne'} />
                    ) : (
                        <div className="flex items-center h-14">
                            <Checkbox
                                name="legallyCompetent"
                                isSelected={legallyCompetent}
                                onValueChange={setLegallyCompetent}
                                isDisabled={isLoading}
                            >
                                Svéprávný
                            </Checkbox>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField label="Telefon" value={phone} />
                    ) : (
                        <Input
                            isDisabled={isLoading}
                            isInvalid={!!errors.phone}
                            errorMessage={errors.phone}
                            label="Telefon"
                            labelPlacement="inside"
                            name="phone"
                            type="tel"
                            value={phone}
                            onValueChange={(value) => {
                                setPhone(formatPhoneNumber(value));
                                if (errors.phone) {
                                    setErrors({ ...errors, phone: undefined });
                                }
                            }}
                            maxLength={17}
                        />
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField label="Osobní číslo" value={personalNumber} />
                    ) : (
                        <NumberInput
                            hideStepper
                            isDisabled={isLoading}
                            label="Osobní číslo"
                            labelPlacement="inside"
                            name="personalNumber"
                            type="number"
                            value={personalNumber}
                            onValueChange={setPersonalNumber}
                        />
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
                            disallowEmptySelection
                            isDisabled={isLoading}
                            label="Příspěvek na péči"
                            labelPlacement="inside"
                            name="benefits"
                            selectedKeys={[benefits]}
                            onSelectionChange={(keys) => setBenefits(Array.from(keys)[0])}
                        >
                            {benefitsOptions.map((b) => (
                                <SelectItem key={b.key} value={b.key}>
                                    {b.name}
                                </SelectItem>
                            ))}
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
                            label="Úkony"
                            labelPlacement="inside"
                            name="taskIds"
                            selectionMode="multiple"
                            selectedKeys={taskIds.map(id => id.toString())}
                            onSelectionChange={(keys) => {
                                const selectedIds = Array.from(keys).map(key => parseInt(key));
                                setTaskIds(selectedIds);
                            }}
                            classNames={{
                                trigger: "min-h-12",
                            }}
                            renderValue={(items) => {
                                const count = items.length;
                                return `Celkem: ${count}`;
                            }}
                        >
                            {tasks.map((task) => (
                                <SelectItem
                                    key={task.id.toString()}
                                    value={task.id.toString()}
                                    textValue={task.name}
                                >
                                    {task.name}
                                </SelectItem>
                            ))}
                        </Select>
                    )}
                </div>

                {isReadOnly ? (
                    <ReadOnlyField label="Kontakt na příbuzné" value={relativesContact} />
                ) : (
                    <Textarea
                        isDisabled={isLoading}
                        label="Kontakt na příbuzné"
                        labelPlacement="inside"
                        name="relativesContact"
                        value={relativesContact}
                        onValueChange={setRelativesContact}
                        minRows={2}
                    />
                )}

                {isReadOnly ? (
                    <ReadOnlyField label="Praktický lékař" value={generalPractitioner} />
                ) : (
                    <Textarea
                        isDisabled={isLoading}
                        label="Praktický lékař"
                        labelPlacement="inside"
                        name="generalPractitioner"
                        value={generalPractitioner}
                        onValueChange={setGeneralPractitioner}
                        minRows={2}
                    />
                )}

                {isReadOnly ? (
                    <ReadOnlyField label="Poznámky" value={notes} />
                ) : (
                    <Textarea
                        isDisabled={isLoading}
                        label="Poznámky"
                        labelPlacement="inside"
                        name="notes"
                        value={notes}
                        onValueChange={setNotes}
                        minRows={2}
                    />
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
                            <DatePicker
                                isInvalid={!!errors.terminationDate}
                                errorMessage={errors.terminationDate}
                                label="Datum ukončení smlouvy"
                                labelPlacement="inside"
                                name="terminationDate"
                                value={terminationDate ? parseDate(terminationDate) : null}
                                onChange={(date) => {
                                    setTerminationDate(date ? date.toString() : "");
                                    if (errors.terminationDate) {
                                        setErrors({ ...errors, terminationDate: undefined });
                                    }
                                }}
                                showMonthAndYearPickers
                                selectorIcon={<CalendarDays size={18} />}
                                minValue={new CalendarDate(MIN_YEAR, 1, 1)}
                                maxValue={today(getLocalTimeZone())}
                                isRequired
                                isDisabled={isLoading}
                                classNames={{
                                    segment: "text-default-500"
                                }}
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
                                errorMessage={errors.terminationReason}
                                label="Důvod ukončení smlouvy"
                                labelPlacement="inside"
                                name="terminationReason"
                                selectedKeys={terminationReason ? [terminationReason] : []}
                                onSelectionChange={(keys) => {
                                    setTerminationReason(Array.from(keys)[0]);
                                    if (errors.terminationReason) {
                                        setErrors({ ...errors, terminationReason: undefined });
                                    }
                                }}
                                isRequired
                                isDisabled={isLoading}
                            >
                                {terminationReasonOptions.map((reason) => (
                                    <SelectItem key={reason.key} value={reason.key}>
                                        {reason.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        )}
                    </>
                )}
            </div>
        </Form>
        {isReadOnly && initialData?.latitude != null && initialData?.longitude != null && (
            <MapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                latitude={initialData.latitude}
                longitude={initialData.longitude}
            />
        )}
        </>
    );
});

ClientForm.displayName = "ClientForm";
