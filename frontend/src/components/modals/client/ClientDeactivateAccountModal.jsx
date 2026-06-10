import React from "react";
import {
    Modal,
    Button,
} from "@heroui/react";
import {UserRoundX} from "lucide-react";

export function ClientDeactivateAccountModal({ isOpen, onClose, onSubmit, clientId, clientName }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    async function handleSubmit() {
        if (!clientId) return;

        setIsSubmitting(true);

        try {
            await onSubmit(clientId);
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
                            <Modal.Heading>Deaktivovat účet klienta</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="text-foreground/50 text-sm">
                            <p>
                                Opravdu chcete deaktivovat účet klienta {clientName}?
                            </p>
                            <p>
                                Klient se dočasně nebude moci přihlásit do aplikace. Účet lze kdykoli znovu aktivovat.
                            </p>
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button variant="outline" onPress={onClose}>
                                Zavřít
                            </Button>
                            <Button variant="danger"
                                className="text-base"
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                                onPress={handleSubmit}
                            >{isSubmitting ? "Ukládání..." : "Deaktivovat účet"} <UserRoundX className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
