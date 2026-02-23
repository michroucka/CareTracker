import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Button,
    ModalFooter
} from "@heroui/react";
import {ClipboardX} from "lucide-react";

export function TaskTerminateModal({ isOpen, onClose, onSubmit, taskId, taskName }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit && taskId) {
                await onSubmit(taskId);
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
                    Deaktivovat úkon
                </ModalHeader>
                <ModalBody className="text-foreground/50 text-sm gap-1">
                    <p>Opravdu chcete deaktivovat úkon {taskName}?</p>
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
                        endContent={<ClipboardX className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isSubmitting ? "Ukládání..." : "Deaktivovat"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}