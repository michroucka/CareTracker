import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";
import { Save } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext.tsx";
import { PerformedTaskForm } from "../../forms/PerformedTaskForm.jsx";

export function PerformedTaskCreateModal({ isOpen, onClose, onSubmit, clients = [], caregivers = [], tasks = [] }) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const formRef = React.useRef();

    async function handleSubmit(formData) {
        setIsLoading(true);
        try {
            if (onSubmit) {
                await onSubmit(formData);
            }
            // If successful, reset form
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
                <ModalHeader className="flex flex-col gap-1">Zadat nový provedený úkon</ModalHeader>
                <ModalBody>
                    <PerformedTaskForm
                        ref={formRef}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        clients={clients}
                        caregivers={caregivers}
                        tasks={tasks}
                        userEmployeeId={user?.employeeId}
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
                        endContent={<Save className="size-4" />}
                        onPress={handleFormSubmit}
                    >
                        {isLoading ? "Ukládání..." : "Uložit úkon"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
