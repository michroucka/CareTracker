import {
    Modal,
    Button,
} from "@heroui/react";
import { Plus } from "lucide-react";
import React from "react";
import { OrganizationForm } from "../../forms/OrganizationForm";

export function OrganizationCreateModal({ isOpen, onClose, onSubmit, employees = [] }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const formRef = React.useRef();

    async function handleSubmit(formData) {
        setIsLoading(true);
        try {
            await onSubmit?.(formData);
            formRef.current?.reset();
        } catch (error) {
            console.error("Error submitting form:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-1">
                            <Modal.Heading>Přidat novou organizaci</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <OrganizationForm
                                ref={formRef}
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                                employees={employees}
                            />
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button
                                variant="outline"
                                isDisabled={isLoading}
                                onPress={() => formRef.current?.reset()}
                            >
                                Reset
                            </Button>
                            <Button variant="primary"
                                isPending={isLoading}
                                isDisabled={isLoading}
                                onPress={() => formRef.current?.submit()}
                            >{isLoading ? "Ukládání..." : "Přidat organizaci"} <Plus className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
