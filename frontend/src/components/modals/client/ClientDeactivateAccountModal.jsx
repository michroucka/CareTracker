import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Button,
    ModalFooter,
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
        <Modal isOpen={isOpen}
               onClose={onClose}
               size="sm"
               scrollBehavior="outside"
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center pb-0">
                    Deaktivovat účet klienta
                </ModalHeader>
                <ModalBody className="text-foreground/50 text-sm">
                    <p>
                        Opravdu chcete deaktivovat účet klienta {clientName}?
                    </p>
                    <p>
                        Klient se dočasně nebude moci přihlásit do aplikace. Účet lze kdykoli znovu aktivovat.
                    </p>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button variant="bordered" onPress={onClose}>
                        Zavřít
                    </Button>
                    <Button
                        className="text-base"
                        color="danger"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                        endContent={<UserRoundX className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isSubmitting ? "Ukládání..." : "Deaktivovat účet"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
