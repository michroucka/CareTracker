import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Button,
    ModalFooter
} from "@heroui/react";
import {Ban} from "lucide-react";

export function DepartmentTerminateModal({ isOpen, onClose, onSubmit, departmentId, departmentName }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit && departmentId) {
                await onSubmit(departmentId);
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
                    Deaktivovat středisko
                </ModalHeader>
                <ModalBody className="text-foreground/50 text-sm gap-1">
                    <p>Opravdu chcete deaktivovat středisko {departmentName}?</p>
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
                        endContent={<Ban className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isSubmitting ? "Ukládání..." : "Deaktivovat"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}