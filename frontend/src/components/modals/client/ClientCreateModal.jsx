import {
    Modal,
    Button,
} from "@heroui/react";
import { Plus } from "lucide-react";
import React from "react";
import { ClientForm } from "../../forms/ClientForm.jsx";

export function ClientCreateModal({ isOpen, onClose, onSubmit, userDept, departments = [], caregivers = [], tasks = [] }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const formRef = React.useRef();

    async function handleSubmit(formData) {
        setIsLoading(true);
        try {
            if (onSubmit) {
                await onSubmit(formData);
            }
            // If successful, reset form and close modal
            formRef.current?.reset();
        } catch (error) {
            // If error, keep modal open and form filled
            console.error("Error submitting form:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    function handleReset() {
        formRef.current?.reset();
    }

    function handleFormSubmit() {
        formRef.current?.submit();
    }

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog className="max-h-[90dvh] overflow-clip">
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-1">
                            <Modal.Heading>Přidat nového klienta</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="overflow-y-auto -mr-6 pr-6">
                            <ClientForm
                                ref={formRef}
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                                departments={departments}
                                caregivers={caregivers}
                                tasks={tasks}
                                userDept={userDept}
                            />
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button
                                className="text-base"
                                type="reset"
                                variant="outline"
                                isDisabled={isLoading}
                                onPress={handleReset}
                            >
                                Reset
                            </Button>
                            <Button variant="primary"
                                className="text-base"
                                isPending={isLoading}
                                isDisabled={isLoading}
                                onPress={handleFormSubmit}
                            >{isLoading ? "Ukládání..." : "Přidat klienta"} <Plus className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
