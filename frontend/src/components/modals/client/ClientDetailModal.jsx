import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Checkbox,
    Select,
    SelectItem,
    Textarea,
    DatePicker,
    Form,
    NumberInput,
    Spinner,
} from "@heroui/react";
import { Save, CalendarDays, Pencil, X } from "lucide-react";
import React from "react";
import { CalendarDate, parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { formatPostalCode, formatPhoneNumber } from "../../../utils/formatters.js";
import {benefitsOptions, terminationReasonOptions} from "../../../constants/clientConstants.js";
import {ReadOnlyField} from "../../ReadOnlyField.jsx";

export function ClientDetailModal({ isOpen, onClose, onSubmit, canEdit, client, isLoading, departments = [], caregivers = [], tasks = [] }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Sledování aktuálních dat klienta (aktualizuje se po uložení)
    const [currentClientData, setCurrentClientData] = React.useState(null);

    // Edit mode state - inicializuje se z client objektu
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

    // Filtrovaní caregiveři podle vybraného department
    const filteredCaregivers = React.useMemo(() => {
        if (!departmentId) {
            return caregivers;
        }
        return caregivers.filter(caregiver =>
            caregiver.department?.id === departmentId
        );
    }, [caregivers, departmentId]);

    // Resetuj caregiverId pokud vybraný caregiver není v filtrovaném seznamu
    React.useEffect(() => {
        if (isEditMode && caregiverId && !filteredCaregivers.find(cg => cg.id === caregiverId)) {
            setCaregiverId(null);
        }
    }, [caregiverId, filteredCaregivers, isEditMode]);

    // Inicializuj state když se client načte
    React.useEffect(() => {
        if (client) {
            setCurrentClientData(client);
            initializeEditState(client);
        }
    }, [client]);

    React.useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

    // Funkce pro inicializaci edit state z client objektu
    const initializeEditState = (clientData) => {
        setFirstName(clientData.firstName || "");
        setLastName(clientData.lastName || "");
        setGender(clientData.gender || "");
        setPersonalNumber(clientData.personalNumber || null);
        setDateOfBirth(clientData.dateOfBirth || "");
        setEmail(clientData.email || "");
        setPhone(clientData.phone || "");
        setStreet(clientData.street || "");
        setCity(clientData.city || "");
        setPostalCode(clientData.postalCode || "");
        setLegallyCompetent(clientData.legallyCompetent ?? true);
        setBenefits(clientData.benefits || "NONE");
        setRelativesContact(clientData.relativesContact || "");
        setGeneralPractitioner(clientData.generalPractitioner || "");
        setNotes(clientData.notes || "");
        setDepartmentId(clientData.department?.id || null);
        setCaregiverId(clientData.caregiver?.id || null);
        setTaskIds(clientData.tasks?.map(t => t.id) || []);
        setTerminationDate(clientData.terminationDate || null);
        setTerminationReason(clientData.terminationReason || "");
    };

    // Zapni edit mode
    const handleEnterEditMode = () => {
        if (currentClientData && canEdit) {
            initializeEditState(currentClientData); // Refresh data před editací
            setIsEditMode(true);
        }
    };

    // Zruš edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        setErrors({});
        if (currentClientData) {
            initializeEditState(currentClientData); // Vrať uložená data
        }
    };

    // Validace formuláře
    function validateForm() {
        const newErrors = {};

        if (!firstName.trim()) newErrors.firstName = "Prosím zadejte jméno";
        if (!lastName.trim()) newErrors.lastName = "Prosím zadejte příjmení";
        if (!gender) newErrors.gender = "Prosím vyberte pohlaví";
        if (!dateOfBirth) newErrors.dateOfBirth = "Prosím zadejte datum narození";
        if (!departmentId) newErrors.departmentId = "Prosím vyberte oddělení";
        if (!caregiverId) newErrors.caregiverId = "Prosím vyberte pečovatele";
        if (!street) newErrors.street = "Prosím zadejte ulici a číslo popisné";
        if (!city) newErrors.city = "Prosím zadejte město";
        if (!postalCode) newErrors.postalCode = "Prosím zadejte PSČ";
        if (!client.active) {
            if (!terminationDate) newErrors.terminationDate = "Prosím zadejte datum ukončení smlouvy";
            if (!terminationReason) newErrors.terminationReason = "Prosím zadejte důvod ukončení smlouvy";
        }

        // Email validace
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = "Prosím zadejte platnou emailovou adresu";
            }
        }

        // Telefon validace
        if (phone && phone.trim()) {
            const phoneWithPlus = /^\+\d{3} \d{3} \d{3} \d{3}$/;
            const phoneWithoutPlus = /^\d{3} \d{3} \d{3}$/;
            if (!phoneWithPlus.test(phone) && !phoneWithoutPlus.test(phone)) {
                newErrors.phone = "Neplatný formát telefonu";
            }
        }

        // PSČ validace
        if (postalCode && postalCode.trim()) {
            const postalCodeRegex = /^\d{3} \d{2}$/;
            if (!postalCodeRegex.test(postalCode)) {
                newErrors.postalCode = "Neplatný formát PSČ";
            }
        }

        return newErrors;
    }

    // Submit změn
    async function handleSubmit(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const clientData = {
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

        try {
            if (onSubmit && client) {
                const updatedClient = await onSubmit(client.id, clientData);
                setCurrentClientData(updatedClient);
                initializeEditState(updatedClient);
            }
            setIsEditMode(false);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    Detail klienta
                </ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[50vh]">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner size="lg" label="Načítání klienta..." />
                        </div>
                    ) : client ? (
                        <Form
                            className="w-full space-y-4"
                            validationErrors={errors}
                            onSubmit={handleSubmit}
                        >
                            <div className="flex flex-col gap-4 w-full">
                                {/* Základní informace */}
                                <div className="grid grid-cols-2 gap-4">
                                    {isEditMode ? (
                                        <Input
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
                                            isDisabled={isSubmitting}
                                        />
                                    ) : (
                                        <ReadOnlyField label="Jméno" value={firstName} />
                                    )}

                                    {isEditMode ? (
                                        <Input
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
                                            isDisabled={isSubmitting}
                                        />
                                    ) : (
                                        <ReadOnlyField label="Příjmení" value={lastName} />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {isEditMode ? (
                                        <Select
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
                                            isDisabled={isSubmitting}
                                        >
                                            <SelectItem key="MALE" value="MALE">Muž</SelectItem>
                                            <SelectItem key="FEMALE" value="FEMALE">Žena</SelectItem>
                                        </Select>
                                    ) : (
                                        <ReadOnlyField
                                            label="Pohlaví"
                                            value={gender === 'MALE' ? 'Muž' : gender === 'FEMALE' ? 'Žena' : '-'}
                                        />
                                    )}

                                    {isEditMode ? (
                                        <DatePicker
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
                                            selectorIcon={<CalendarDays size={18} />}
                                            placeholderValue={new CalendarDate(1960, 1, 1)}
                                            minValue={new CalendarDate(1900, 1, 1)}
                                            maxValue={today(getLocalTimeZone())}
                                            isRequired
                                            isDisabled={isSubmitting}
                                            classNames={{
                                                segment: "text-default-500"
                                            }}
                                        />
                                    ) : (
                                        <ReadOnlyField
                                            label="Datum narození"
                                            value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('cs-CZ') : '-'}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {isEditMode ? (
                                        <Select
                                            isRequired
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
                                            isDisabled={isSubmitting}
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
                                    ) : (
                                        <ReadOnlyField
                                            label="Středisko"
                                            value={departments.find(d => d.id === departmentId)?.name || '-'}
                                        />
                                    )}

                                    {isEditMode ? (
                                        <Select
                                            isRequired
                                            isDisabled={isSubmitting || !departmentId}
                                            isInvalid={!!errors.caregiverId}
                                            errorMessage={errors.caregiverId}
                                            label="Klíčový pracovník"
                                            labelPlacement="inside"
                                            name="caregiverId"
                                            selectedKeys={caregiverId ? [caregiverId.toString()] : []}
                                            onSelectionChange={(keys) => {
                                                const selectedId = Array.from(keys)[0];
                                                setCaregiverId(selectedId ? parseInt(selectedId) : null);
                                                if (errors.caregiverId) {
                                                    setErrors({ ...errors, caregiverId: undefined });
                                                }
                                            }}
                                        >
                                            {filteredCaregivers.map((caregiver) => {
                                                const caregiverName = `${caregiver.firstName} ${caregiver.lastName}`;
                                                return (
                                                    <SelectItem
                                                        key={caregiver.id.toString()}
                                                        value={caregiver.id.toString()}
                                                        textValue={caregiverName}
                                                    >
                                                        {caregiverName}
                                                    </SelectItem>
                                                );
                                            })}
                                        </Select>
                                    ) : (
                                        <ReadOnlyField
                                            label="Klíčový pracovník"
                                            value={
                                                caregivers.find(c => c.id === caregiverId)
                                                    ? `${caregivers.find(c => c.id === caregiverId).firstName} ${caregivers.find(c => c.id === caregiverId).lastName}`
                                                    : '-'
                                            }
                                        />
                                    )}
                                </div>

                                {/* Adresa */}
                                {isEditMode ? (
                                    <Input
                                        isRequired
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
                                        isDisabled={isSubmitting}
                                    />
                                ) : (
                                    <ReadOnlyField label="Ulice a číslo popisné" value={street} />
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    {isEditMode ? (
                                        <Input
                                            isRequired
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
                                            isDisabled={isSubmitting}
                                        />
                                    ) : (
                                        <ReadOnlyField label="Město" value={city} className="col-span-2" />
                                    )}
                                    {isEditMode ? (
                                        <Input
                                            isRequired
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
                                            isDisabled={isSubmitting}
                                        />
                                    ) : (
                                        <ReadOnlyField label="PSČ" value={postalCode} />
                                    )}
                                </div>

                                <div className="flex gap-4 items-start">
                                    {isEditMode ? (
                                        <Input
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
                                            isDisabled={isSubmitting}
                                        />
                                    ) : (
                                        <ReadOnlyField label="Email" value={email} />
                                    )}

                                    {isEditMode ? (
                                        <div className="flex items-center h-14">
                                            <Checkbox
                                                name="legallyCompetent"
                                                isSelected={legallyCompetent}
                                                onValueChange={setLegallyCompetent}
                                                isDisabled={isSubmitting}
                                            >
                                                Svéprávný
                                            </Checkbox>
                                        </div>
                                    ) : (
                                        <ReadOnlyField label="Svéprávný" value={legallyCompetent ? 'Ano' : 'Ne'} />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {isEditMode ? (
                                        <Input
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
                                            isDisabled={isSubmitting}
                                        />
                                    ) : (
                                        <ReadOnlyField label="Telefon" value={phone} />
                                    )}

                                    {isEditMode ? (
                                        <NumberInput
                                            hideStepper
                                            label="Osobní číslo"
                                            labelPlacement="inside"
                                            name="personalNumber"
                                            type="number"
                                            value={personalNumber}
                                            onValueChange={setPersonalNumber}
                                            isDisabled={isSubmitting}
                                        />
                                    ) : (
                                        <ReadOnlyField label="Osobní číslo" value={personalNumber} />
                                    )}
                                </div>

                                {/* Další informace */}
                                <div className="grid grid-cols-2 gap-4">
                                    {isEditMode ? (
                                        <Select
                                            disallowEmptySelection
                                            label="Příspěvek na péči"
                                            labelPlacement="inside"
                                            name="benefits"
                                            selectedKeys={[benefits]}
                                            onSelectionChange={(keys) => setBenefits(Array.from(keys)[0])}
                                            isDisabled={isSubmitting}
                                        >
                                            {benefitsOptions.map((b) => (
                                                <SelectItem key={b.key} value={b.key}>
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    ) : (
                                        <ReadOnlyField
                                            label="Příspěvek na péči"
                                            value={benefitsOptions.find(b => b.key === benefits)?.name || '-'}
                                        />
                                    )}

                                    {isEditMode ? (
                                        <Select
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
                                                return `Celkem: ${items.length}`;
                                            }}
                                            isDisabled={isSubmitting}
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
                                    ) : (
                                        <ReadOnlyField
                                            label="Úkony"
                                            value={
                                                taskIds.length > 0
                                                    ? tasks.filter(t => taskIds.includes(t.id)).map(t => t.name).join(', ')
                                                    : '-'
                                            }
                                        />
                                    )}
                                </div>

                                {isEditMode ? (
                                    <Textarea
                                        label="Kontakt na příbuzné"
                                        labelPlacement="inside"
                                        name="relativesContact"
                                        value={relativesContact}
                                        onValueChange={setRelativesContact}
                                        minRows={2}
                                        isDisabled={isSubmitting}
                                    />
                                ) : (
                                    <ReadOnlyField label="Kontakt na příbuzné" value={relativesContact} />
                                )}

                                {isEditMode ? (
                                    <Textarea
                                        label="Praktický lékař"
                                        labelPlacement="inside"
                                        name="generalPractitioner"
                                        value={generalPractitioner}
                                        onValueChange={setGeneralPractitioner}
                                        minRows={2}
                                        isDisabled={isSubmitting}
                                    />
                                ) : (
                                    <ReadOnlyField label="Praktický lékař" value={generalPractitioner} />
                                )}

                                {isEditMode ? (
                                    <Textarea
                                        isDisabled={isSubmitting}
                                        label="Poznámky"
                                        labelPlacement="inside"
                                        name="notes"
                                        value={notes}
                                        onValueChange={setNotes}
                                        minRows={2}
                                    />
                                ) : (
                                    <ReadOnlyField label="Poznámky" value={notes} />
                                )}

                                {!client.active && (
                                    <>
                                        {isEditMode ? (
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
                                                        setErrors({ ...errors, terminationDate: undefined});
                                                    }
                                                }}
                                                showMonthAndYearPickers
                                                selectorIcon={<CalendarDays size={18} />}
                                                minValue={new CalendarDate(1900, 1, 1)}
                                                maxValue={today(getLocalTimeZone())}
                                                isRequired
                                                isDisabled={isSubmitting}
                                                classNames={{
                                                    segment: "text-default-500"
                                                }}
                                            />
                                        ) : (
                                            <ReadOnlyField
                                                label="Datum ukončení smlouvy"
                                                value={terminationDate ? new Date(terminationDate).toLocaleDateString('cs-CZ') : '-'}
                                            />
                                        )}

                                        {isEditMode ? (
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
                                                isDisabled={isSubmitting}
                                            >
                                                {terminationReasonOptions.map((reason) => (
                                                    <SelectItem key={reason.key} value={reason.key}>
                                                        {reason.name}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        ) : (
                                            <ReadOnlyField
                                                label="Důvod ukončení smlouvy"
                                                value={terminationReasonOptions.find(r => r.key === terminationReason)?.name || '-'}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </Form>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Klient nebyl nalezen
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="justify-between">
                    {isEditMode ? (
                        <>
                            <Button
                                variant="bordered"
                                startContent={<X size={16} />}
                                onPress={handleCancelEdit}
                                isDisabled={isSubmitting}
                            >
                                Zrušit
                            </Button>
                            <Button
                                color="primary"
                                startContent={<Save size={16} />}
                                onPress={handleSubmit}
                                isLoading={isSubmitting}
                                isDisabled={isSubmitting}
                            >
                                {isSubmitting ? "Ukládání..." : "Uložit změny"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="bordered" onPress={onClose}>
                                Zavřít
                            </Button>
                            {canEdit && (
                                <Button
                                    color="primary"
                                    startContent={<Pencil size={16} />}
                                    onPress={handleEnterEditMode}
                                >
                                    Upravit
                                </Button>
                            )}
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}