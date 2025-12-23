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

export function DailyRecordDeleteModal({ isOpen, onClose, onSubmit, dailyRecordId }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit && dailyRecordId) {
                await onSubmit(dailyRecordId);
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
               size="sm"
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center pb-0">
                    Smazat denní záznam
                </ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[50vh] text-foreground/50 text-sm gap-1">
                    <p>Opravdu chcete smazat tento denní záznam?</p>
                    <p className="text-danger/75">Tato akce je nevratná!</p>
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
                        endContent={<Trash2 className="size-4" />}
                        onPress={handleSubmit}
                    >
                        Smazat
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
