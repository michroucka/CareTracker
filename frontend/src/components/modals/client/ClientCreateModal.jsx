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
} from "@heroui/react";
import { Plus, CalendarDays } from "lucide-react";
import React from "react";
import { CalendarDate, getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { formatPostalCode, formatPhoneNumber } from "../../../utils/formatters.js";
import {benefitsOptions} from "../../../constants/clientConstants.js";

export function ClientCreateModal({ isOpen, onClose, onSubmit, departments = [], caregivers = [] , tasks = []}) {
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

    const [errors, setErrors] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);

    function validateForm() {
        const newErrors = {};

        // Required pole
        if (!firstName.trim()) {
            newErrors.firstName = "Prosím zadejte jméno";
        }
        if (!lastName.trim()) {
            newErrors.lastName = "Prosím zadejte příjmení";
        }
        if (!gender) {
            newErrors.gender = "Prosím vyberte pohlaví";
        }
        if (!dateOfBirth) {
            newErrors.dateOfBirth = "Prosím zadejte datum narození";
        }
        if (!departmentId) {
            newErrors.departmentId = "Prosím vyberte oddělení";
        }
        if (!caregiverId) {
            newErrors.caregiverId = "Prosím vyberte pečovatele";
        }

        if (!street) {
            newErrors.street = "Prosím zadejte ulici a číslo popisné";
        }

        if (!city) {
            newErrors.city = "Prosím zadejte město";
        }

        if (!postalCode) {
            newErrors.postalCode = "Prosím zadjte PSČ";
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
            // Formát: +XXX XXX XXX XXX (12-16 znaků s mezerami) nebo XXX XXX XXX (11 znaků s mezerami)
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

    async function handleSubmit(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        // Validace před odesláním
        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Vše je validní, připrav data a zavolej původní onSubmit
        setErrors({});
        setIsLoading(true);

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
        };

        try {
            if (onSubmit) {
                await onSubmit(clientData);
            }
            // Pokud úspěch, reset formuláře
            resetForm();
        } catch (error) {
            // Pokud error, formulář zůstane vyplněný
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    }

    function resetForm() {
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
        setErrors({});
    }

    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
               size="lg"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Přidat nového klienta</ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[50vh]">
                    <Form
                        className="w-full space-y-4"
                        validationErrors={errors}
                        onReset={() => resetForm()}
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col gap-4 w-full">
                            {/* Základní informace */}
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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

                                <Select
                                    isRequired
                                    isDisabled={isLoading}
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
                                    {caregivers.map((caregiver) => {
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
                            </div>

                            {/* Adresa */}
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

                            <div className="grid grid-cols-3 gap-4">
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
                            </div>

                            <div className="flex gap-4 items-start">
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            {/* Další informace */}
                            <div className="grid grid-cols-2 gap-4">
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
                                            textValue={task.taskName}
                                        >
                                            {task.taskName}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <Textarea
                                isDisabled={isLoading}
                                label="Kontakt na příbuzné"
                                labelPlacement="inside"
                                name="relativesContact"
                                value={relativesContact}
                                onValueChange={setRelativesContact}
                                minRows={2}
                            />

                            <Textarea
                                isDisabled={isLoading}
                                label="Praktický lékař"
                                labelPlacement="inside"
                                name="generalPractitioner"
                                value={generalPractitioner}
                                onValueChange={setGeneralPractitioner}
                                minRows={2}
                            />

                            <Textarea
                                isDisabled={isLoading}
                                label="Poznámky"
                                labelPlacement="inside"
                                name="notes"
                                value={notes}
                                onValueChange={setNotes}
                                minRows={2}
                            />
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        className="text-base"
                        type="reset"
                        variant="bordered"
                        isDisabled={isLoading}
                        onPress={() => resetForm()}
                    >
                        Reset
                    </Button>
                    <Button
                        className="text-base"
                        color="primary"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                        endContent={<Plus className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isLoading ? "Ukládání..." : "Přidat klienta"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
