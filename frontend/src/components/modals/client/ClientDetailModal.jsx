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

export function ClientDetailModal({ isOpen, onClose, onSubmit, client, isLoading, departments = [], caregivers = [] }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

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

    const [errors, setErrors] = React.useState({});

    // Inicializuj state když se client načte
    React.useEffect(() => {
        if (client) {
            initializeEditState(client);
        }
    }, [client]);

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
    };

    // Zapni edit mode
    const handleEnterEditMode = () => {
        if (client) {
            initializeEditState(client); // Refresh data před editací
            setIsEditMode(true);
        }
    };

    // Zruš edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        setErrors({});
        if (client) {
            initializeEditState(client); // Vrať původní data
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
        };

        try {
            if (onSubmit && client) {
                await onSubmit(client.id, clientData); // Předej ID pro update
            }
            setIsEditMode(false);
            onClose(); // Zavři modal - parent refreshne data
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const isDisabled = !isEditMode || isSubmitting;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    Detail klienta
                </ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[70vh]">
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
                                    <Input
                                        isDisabled={isDisabled}
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

                                    <Input
                                        isDisabled={isDisabled}
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        isDisabled={isDisabled}
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

                                    <DatePicker
                                        isDisabled={isDisabled}
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
                                        classNames={{
                                            segment: "text-default-500"
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        isRequired
                                        isDisabled={isDisabled}
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
                                            <SelectItem key={dept.id.toString()} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        isRequired
                                        isDisabled={isDisabled}
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
                                        {caregivers.map((caregiver) => (
                                            <SelectItem key={caregiver.id.toString()} value={caregiver.id.toString()}>
                                                {`${caregiver.firstName} ${caregiver.lastName}`}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Adresa */}
                                <Input
                                    isRequired
                                    isDisabled={isDisabled}
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

                                <div className="grid grid-cols-3 gap-4">
                                    <Input
                                        isRequired
                                        isDisabled={isDisabled}
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
                                    <Input
                                        isRequired
                                        isDisabled={isDisabled}
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
                                </div>

                                <Input
                                    isDisabled={isDisabled}
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
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        isDisabled={isDisabled}
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

                                    <NumberInput
                                        hideStepper
                                        isDisabled={isDisabled}
                                        label="Osobní číslo"
                                        labelPlacement="inside"
                                        name="personalNumber"
                                        type="number"
                                        value={personalNumber}
                                        onValueChange={setPersonalNumber}
                                    />
                                </div>

                                {/* Další informace */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        isDisabled={isDisabled}
                                        label="Příspěvek na péči"
                                        labelPlacement="inside"
                                        name="benefits"
                                        selectedKeys={[benefits]}
                                        onSelectionChange={(keys) => setBenefits(Array.from(keys)[0])}
                                    >
                                        <SelectItem key="NONE" value="NONE">Žádný</SelectItem>
                                        <SelectItem key="ONE" value="ONE">I. stupeň</SelectItem>
                                        <SelectItem key="TWO" value="TWO">II. stupeň</SelectItem>
                                        <SelectItem key="THREE" value="THREE">III. stupeň</SelectItem>
                                        <SelectItem key="FOUR" value="FOUR">IV. stupeň</SelectItem>
                                    </Select>

                                    <div className="flex items-center">
                                        <Checkbox
                                            name="legallyCompetent"
                                            isSelected={legallyCompetent}
                                            onValueChange={setLegallyCompetent}
                                            isDisabled={isDisabled}
                                        >
                                            Svéprávný
                                        </Checkbox>
                                    </div>
                                </div>

                                <Textarea
                                    isDisabled={isDisabled}
                                    label="Kontakt na příbuzné"
                                    labelPlacement="inside"
                                    name="relativesContact"
                                    value={relativesContact}
                                    onValueChange={setRelativesContact}
                                    minRows={2}
                                />

                                <Textarea
                                    isDisabled={isDisabled}
                                    label="Praktický lékař"
                                    labelPlacement="inside"
                                    name="generalPractitioner"
                                    value={generalPractitioner}
                                    onValueChange={setGeneralPractitioner}
                                    minRows={2}
                                />

                                <Textarea
                                    isDisabled={isDisabled}
                                    label="Poznámky"
                                    labelPlacement="inside"
                                    name="notes"
                                    value={notes}
                                    onValueChange={setNotes}
                                    minRows={2}
                                />
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
                            <Button
                                color="primary"
                                startContent={<Pencil size={16} />}
                                onPress={handleEnterEditMode}
                            >
                                Upravit
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}