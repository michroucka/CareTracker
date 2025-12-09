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
    Form
} from "@heroui/react";
import { Plus, CalendarDays } from "lucide-react";
import React from "react";
import {CalendarDate, getLocalTimeZone, parseDate, today} from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";

export function ClientCreateModal({ isOpen, onClose, onSubmit }) {
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [gender, setGender] = React.useState("");
    const [personalNumber, setPersonalNumber] = React.useState("");
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
    const [departmentId, setDepartmentId] = React.useState("");
    const [caregiverId, setCaregiverId] = React.useState("");
    const [tasks, setTasks] = React.useState([]);

    const [errors, setErrors] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);

    // Formátování telefonního čísla: volitelně +XXX a pak XXX XXX XXX
    function formatPhoneNumber(value) {
        // Povolit pouze + na začátku a číslice
        let cleaned = value.replace(/[^\d+]/g, '');

        // + může být pouze na začátku
        const hasPlus = cleaned.startsWith('+');
        cleaned = cleaned.replace(/\+/g, '');

        if (hasPlus) {
            // S předčíslím: +XXX XXX XXX XXX (max 3 pro předčíslí + 9 pro číslo)
            const limited = cleaned.slice(0, 12);

            if (limited.length <= 3) {
                // Jen předčíslí
                return `+${limited}`;
            } else if (limited.length <= 6) {
                // Předčíslí + první část
                return `+${limited.slice(0, 3)} ${limited.slice(3)}`;
            } else if (limited.length <= 9) {
                // Předčíslí + první 2 části
                return `+${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
            } else {
                // Plné číslo s předčíslím
                return `+${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`;
            }
        } else {
            // Bez předčíslí: XXX XXX XXX (max 9 číslic)
            const limited = cleaned.slice(0, 9);

            if (limited.length <= 3) {
                return limited;
            } else if (limited.length <= 6) {
                return `${limited.slice(0, 3)} ${limited.slice(3)}`;
            } else {
                return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
            }
        }
    }

    function resetForm() {
        setFirstName("");
        setLastName("");
        setGender("");
        setPersonalNumber("");
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
        setDepartmentId("");
        setCaregiverId("");
        setTasks([]);
    }

    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Přidat nového klienta</ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[70vh]">
                    <Form
                        className="w-full space-y-4"
                        validationErrors={errors}
                        onReset={() => resetForm()}
                        onSubmit={onSubmit}
                    >
                        <div className="flex flex-col gap-4 w-full">
                            {/* Základní informace */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    isDisabled={isLoading}
                                    label="Jméno"
                                    labelPlacement="inside"
                                    name="firstName"
                                    value={firstName}
                                    onValueChange={setFirstName}
                                    isRequired
                                />

                                <Input
                                    isDisabled={isLoading}
                                    label="Příjmení"
                                    labelPlacement="inside"
                                    name="lastName"
                                    value={lastName}
                                    onValueChange={setLastName}
                                    isRequired
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    isDisabled={isLoading}
                                    label="Pohlaví"
                                    labelPlacement="inside"
                                    name="gender"
                                    selectedKeys={gender ? [gender] : []}
                                    onSelectionChange={(keys) => setGender(Array.from(keys)[0])}
                                    isRequired
                                >
                                    <SelectItem key="MALE" value="MALE">Muž</SelectItem>
                                    <SelectItem key="FEMALE" value="FEMALE">Žena</SelectItem>
                                </Select>

                                <I18nProvider locale="cs-u-ca-gregory">
                                    <DatePicker
                                        isDisabled={isLoading}
                                        label="Datum narození"
                                        labelPlacement="inside"
                                        name="dateOfBirth"
                                        value={dateOfBirth ? parseDate(dateOfBirth) : null}
                                        onChange={(date) => setDateOfBirth(date ? date.toString() : "")}
                                        showMonthAndYearPickers
                                        selectorIcon={<CalendarDays size={18}/>}
                                        minValue={new CalendarDate(1900, 1, 1)}
                                        maxValue={today(getLocalTimeZone())}
                                        isRequired
                                    />
                                </I18nProvider>
                            </div>

                            <Input
                                isDisabled={isLoading}
                                label="Email"
                                labelPlacement="inside"
                                name="email"
                                type="email"
                                value={email}
                                onValueChange={setEmail}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    isDisabled={isLoading}
                                    label="Telefon"
                                    labelPlacement="inside"
                                    name="phone"
                                    type="tel"
                                    value={phone}
                                    onValueChange={(value) => setPhone(formatPhoneNumber(value))}
                                    maxLength={17}
                                    description="např. +420 123 456 789"
                                />

                                <Input
                                    isDisabled={isLoading}
                                    label="Osobní číslo"
                                    labelPlacement="inside"
                                    name="personalNumber"
                                    value={personalNumber}
                                    onValueChange={setPersonalNumber}
                                />
                            </div>

                            {/* Adresa */}
                            <Input
                                isDisabled={isLoading}
                                label="Ulice a číslo popisné"
                                labelPlacement="inside"
                                name="street"
                                value={street}
                                onValueChange={setStreet}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    isDisabled={isLoading}
                                    label="Město"
                                    labelPlacement="inside"
                                    name="city"
                                    value={city}
                                    onValueChange={setCity}
                                />

                                <Input
                                    isDisabled={isLoading}
                                    label="PSČ"
                                    labelPlacement="inside"
                                    name="postalCode"
                                    value={postalCode}
                                    onValueChange={setPostalCode}
                                />
                            </div>

                            {/* Další informace */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    isDisabled={isLoading}
                                    label="Dávky"
                                    labelPlacement="inside"
                                    name="benefits"
                                    selectedKeys={[benefits]}
                                    onSelectionChange={(keys) => setBenefits(Array.from(keys)[0])}
                                >
                                    <SelectItem key="NONE" value="NONE">Žádné</SelectItem>
                                    <SelectItem key="DISABILITY" value="DISABILITY">Invalidní důchod</SelectItem>
                                    <SelectItem key="PENSION" value="PENSION">Starobní důchod</SelectItem>
                                    <SelectItem key="OTHER" value="OTHER">Jiné</SelectItem>
                                </Select>

                                <div className="flex items-center">
                                    <Checkbox
                                        name="legallyCompetent"
                                        isSelected={legallyCompetent}
                                        onValueChange={setLegallyCompetent}
                                        isDisabled={isLoading}
                                    >
                                        Právně způsobilý
                                    </Checkbox>
                                </div>
                            </div>

                            <Input
                                isDisabled={isLoading}
                                label="Kontakt na příbuzné"
                                labelPlacement="inside"
                                name="relativesContact"
                                value={relativesContact}
                                onValueChange={setRelativesContact}
                            />

                            <Input
                                isDisabled={isLoading}
                                label="Praktický lékař"
                                labelPlacement="inside"
                                name="generalPractitioner"
                                value={generalPractitioner}
                                onValueChange={setGeneralPractitioner}
                            />

                            <Textarea
                                isDisabled={isLoading}
                                label="Poznámky"
                                labelPlacement="inside"
                                name="notes"
                                value={notes}
                                onValueChange={setNotes}
                                minRows={3}
                            />
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter>
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
                        type="submit"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                        endContent={<Plus className="size-4" />}
                        onPress={onSubmit}
                    >
                        {isLoading ? "Ukládání..." : "Přidat klienta"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
