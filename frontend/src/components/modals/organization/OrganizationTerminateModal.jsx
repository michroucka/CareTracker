import React from "react";
import {
    Modal,
    Button,
} from "@heroui/react";
import {Ban} from "lucide-react";

export function OrganizationTerminateModal({ isOpen, onClose, onSubmit, organizationId, organizationName }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit && organizationId) {
                await onSubmit(organizationId);
            }
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="md">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center pb-0">
                            <Modal.Heading>Deaktivovat organizaci</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="text-foreground/50 text-sm gap-1">
                            <p>Opravdu chcete deaktivovat organizaci {organizationName}?</p>
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
                            >{isSubmitting ? "Ukládání..." : "Deaktivovat"} <Ban className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}