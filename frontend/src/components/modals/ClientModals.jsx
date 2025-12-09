import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Checkbox,
    Link, Divider, Form
} from "@heroui/react";
import {Eye, EyeOff, Plus} from "lucide-react";
import React from "react";

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
                <ModalBody>
                    <Form
                        className="w-full justify-center items-center space-y-4"
                        validationErrors={errors}
                        onReset={() => resetForm()}
                        onSubmit={onSubmit}
                    >
                        <div className="flex flex-col justify-center items-center gap-4 p-12 w-sm">
                            <h1 className="cursor-default">Přihlášení</h1>
                            <Divider className="mb-3 w-5/6" />
                            <Input
                                isDisabled={isLoading}
                                label="Uživatelské jméno"
                                labelPlacement="inside"
                                name="username"
                                value={firstName}
                                onValueChange={(value) => {
                                    setFirstName(value);
                                }}
                                classNames={{
                                    inputWrapper: [
                                        "bg-content2",
                                        "data-[hover=true]:bg-content3",
                                        "data-[focus=true]:bg-content3",
                                        "shadow-md"
                                    ],
                                    label: [
                                        "text-medium",
                                        "group-data-[filled-within=true]:text-foreground/75",
                                    ],
                                    input: [
                                        "text-medium",
                                        "font-semibold"
                                    ]
                                }}
                            />

                            <Input
                                isDisabled={isLoading}
                                label="Heslo"
                                labelPlacement="inside"
                                name="password"
                                value={lastName}
                                onValueChange={(value) => {
                                    setLastName(value);
                                }}
                                classNames={{
                                    inputWrapper: [
                                        "bg-content2",
                                        "data-[hover=true]:bg-content3",
                                        "data-[focus=true]:bg-content3",
                                        "shadow-md"
                                    ],
                                    label: [
                                        "text-base",
                                        "group-data-[filled-within=true]:text-foreground/75",
                                    ],
                                    input: [
                                        "text-base",
                                        "font-semibold"
                                    ]
                                }}
                            />

                            <Checkbox
                                className="self-start"
                                name="remember-me"
                                value="true"
                                isSelected={legallyCompetent}
                                onValueChange={() => setLegallyCompetent(!legallyCompetent)}
                                isDisabled={isLoading}
                            >
                                Zapamatovat si mě
                            </Checkbox>

                            <div className="flex justify-between w-full">
                                <Button
                                    className="text-base"
                                    type="reset"
                                    variant="bordered"
                                    isDisabled={isLoading}
                                >
                                    Reset
                                </Button>
                                <Button
                                    className="w-full text-base"
                                    color="primary"
                                    type="submit"
                                    isLoading={isLoading}
                                    isDisabled={isLoading}
                                >
                                    {isLoading ? "Ukládání..." : "Uložit"}
                                </Button>
                            </div>

                            {/* Mobile ver */}
                            <Link className="text-foreground/50 hover:text-primary self-start hidden sm:block" size="sm" href="/forgot-password">
                                Zapomenuté heslo?
                            </Link>

                            {/* Desktop ver */}
                            <Link className="text-foreground/50 hover:text-primary self-start sm:hidden" size="md" href="/forgot-password">
                                Zapomenuté heslo?
                            </Link>
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary"
                            onPress={() => onSubmit(formData)}
                            endContent={ <Plus className="size-4" /> }
                    >
                        Přidat
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
