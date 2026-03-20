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
import { DepartmentForm } from "../../forms/DepartmentForm.jsx";

export function DepartmentCreateModal({ isOpen, onClose, onSubmit, employees = [], organizationId = null }) {
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Přidat nové středisko</ModalHeader>
                <ModalBody>
                    <DepartmentForm
                        ref={formRef}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        employees={employees}
                        organizationId={organizationId}
                    />
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        variant="bordered"
                        isDisabled={isLoading}
                        onPress={() => formRef.current?.reset()}
                    >
                        Reset
                    </Button>
                    <Button
                        color="primary"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                        endContent={<Plus className="size-4" />}
                        onPress={() => formRef.current?.submit()}
                    >
                        {isLoading ? "Ukládání..." : "Přidat středisko"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
