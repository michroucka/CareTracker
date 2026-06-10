import React from "react";
import {
    Modal,
    Button,
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center pb-0">
                            <Modal.Heading>{title}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="text-foreground/50 text-sm gap-1">
                            <p>{message}</p>
                            {warningMessage && (
                                <p className="text-danger/75">{warningMessage}</p>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button variant="outline" onPress={onClose} isDisabled={isSubmitting}>
                                {cancelButtonText}
                            </Button>
                            <Button variant="danger"
                                className="text-base"
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                                onPress={handleSubmit}
                            >{confirmButtonText} <Trash2 className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
