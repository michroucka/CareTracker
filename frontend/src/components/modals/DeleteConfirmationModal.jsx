import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Button,
    ModalFooter
} from "@heroui/react";
import { Trash2 } from "lucide-react";

/**
 * Generic delete confirmation modal component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSubmit - Submit handler that receives the itemId
 * @param {string|number} props.itemId - ID of the item to delete
 * @param {string} props.title - Modal title (e.g., "Smazat vykonaný úkon")
 * @param {string} props.message - Confirmation message (e.g., "Opravdu chcete smazat tento vykonaný úkon?")
 * @param {string} props.warningMessage - Warning message (defaults to "Tato akce je nevratná!")
 * @param {string} props.confirmButtonText - Text for confirm button (defaults to "Smazat")
 * @param {string} props.cancelButtonText - Text for cancel button (defaults to "Zavřít")
 */
export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onSubmit,
    itemId,
    title = "Smazat položku",
    message = "Opravdu chcete smazat tuto položku?",
    warningMessage = "Tato akce je nevratná!",
    confirmButtonText = "Smazat",
    cancelButtonText = "Zavřít",
}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit && itemId) {
                await onSubmit(itemId);
            }
            onClose();
        } catch (error) {
            console.error("Error deleting item:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalContent>
                <ModalHeader className="flex justify-between items-center pb-0">
                    {title}
                </ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[50vh] text-foreground/50 text-sm gap-1">
                    <p>{message}</p>
                    {warningMessage && (
                        <p className="text-danger/75">{warningMessage}</p>
                    )}
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button variant="bordered" onPress={onClose} isDisabled={isSubmitting}>
                        {cancelButtonText}
                    </Button>
                    <Button
                        className="text-base"
                        color="danger"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                        endContent={<Trash2 className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {confirmButtonText}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
