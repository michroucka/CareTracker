import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Button,
    ModalFooter, Form, Input
} from "@heroui/react";
import {Send} from "lucide-react";

export function ClientCreateAccountModal({ isOpen, onClose, onSubmit, clientName, clientEmail }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [email, setEmail] = React.useState(clientEmail ?? "");

    React.useEffect(() => {
        setEmail(clientEmail ?? "");
    }, [clientEmail]);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        if (!email) {
            setErrors({ email: "Prosím zadejte platný email" });
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            await onSubmit(email);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
               size="sm"
               scrollBehavior="outside"
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center pb-0">
                    Vytvořit klientovi účet
                </ModalHeader>
                <ModalBody className="text-foreground/50 text-sm gap-1">
                    <Form
                        className="w-full space-y-4"
                        validationErrors={errors}
                        onSubmit={handleSubmit}
                    >
                        <p>{clientName} obdrží na zadaný email odkaz pro aktivaci účtu.</p>

                        <div className="flex flex-col gap-4 w-full">
                            <Input
                                isDisabled={isSubmitting}
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
                                isRequired
                            />
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button variant="bordered" onPress={onClose}>
                        Zavřít
                    </Button>
                    <Button
                        className="text-base"
                        color="primary"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                        endContent={<Send className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isSubmitting ? "Odesílání..." : "Odeslat"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
