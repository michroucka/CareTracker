import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Přidat nového klienta</ModalHeader>
                <ModalBody>
                    <ClientForm
                        ref={formRef}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        departments={departments}
                        caregivers={caregivers}
                        tasks={tasks}
                        userDept={userDept}
                    />
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        className="text-base"
                        type="reset"
                        variant="bordered"
                        isDisabled={isLoading}
                        onPress={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        className="text-base"
                        color="primary"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                        endContent={<Plus className="size-4" />}
                        onPress={handleFormSubmit}
                    >
                        {isLoading ? "Ukládání..." : "Přidat klienta"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
