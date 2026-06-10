import React from "react";
import {
    Modal,
    Button,
    Form, TextField, Input, Label, FieldError
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center pb-0">
                            <Modal.Heading>Vytvořit klientovi účet</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="text-foreground/50 text-sm gap-1">
                            <Form
                                className="w-full space-y-4"
                                validationErrors={errors}
                                onSubmit={handleSubmit}
                            >
                                <p>{clientName} obdrží na zadaný email odkaz pro aktivaci účtu.</p>

                                <div className="flex flex-col gap-4 w-full">
                                    <TextField name="email" isRequired type="email" isInvalid={!!errors.email}>
                                        <Label>Email</Label>
                                        <Input
                                            isDisabled={isSubmitting}
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
                                </div>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button variant="outline" onPress={onClose}>
                                Zavřít
                            </Button>
                            <Button variant="primary"
                                className="text-base"
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                                onPress={handleSubmit}
                            >{isSubmitting ? "Odesílání..." : "Odeslat"} <Send className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
