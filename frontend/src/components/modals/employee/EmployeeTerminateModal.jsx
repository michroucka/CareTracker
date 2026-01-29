import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Form,
    Button,
    ModalFooter
} from "@heroui/react";
import { UserRoundX} from "lucide-react";

export function EmployeeTerminateModal({ isOpen, onClose, onSubmit, employeeId, employeeName }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit && employeeId) {
                await onSubmit(employeeId);
            }
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
               size="md"
               scrollBehavior="outside"
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center pb-0">
                    Deaktivovat zaměstnance
                </ModalHeader>
                <ModalBody className="text-foreground/50 text-sm gap-1">
                    <p>Opravdu chcete deaktivovat zaměstnance {employeeName}?</p>
                    <p>Tímto deaktivujete i příslušný účet v aplikaci.</p>
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
                        {isSubmitting ? "Ukládání..." : "Deaktivovat"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}