import React from "react";
import {
    Modal,
    Button,
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="md">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center pb-0">
                            <Modal.Heading>Deaktivovat zaměstnance</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="text-foreground/50 text-sm gap-1">
                            <p>Opravdu chcete deaktivovat zaměstnance {employeeName}?</p>
                            <p>Tímto deaktivujete i příslušný účet v aplikaci.</p>
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
                            >{isSubmitting ? "Ukládání..." : "Deaktivovat"} <UserRoundX className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}