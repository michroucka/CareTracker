import React from "react";
import {
    Modal,
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-1">
                            <Modal.Heading>Zadat nový provedený úkon</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <PerformedTaskForm
                                ref={formRef}
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                                clients={clients}
                                caregivers={caregivers}
                                tasks={tasks}
                                userEmployeeId={user?.employeeId}
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
                            >{isLoading ? "Ukládání..." : "Uložit úkon"} <Save className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
