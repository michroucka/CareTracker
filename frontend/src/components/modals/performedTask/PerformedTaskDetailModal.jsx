import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner,
} from "@heroui/react";
import { Save, X, Pencil } from "lucide-react";
import { PerformedTaskForm } from "../../forms/PerformedTaskForm.jsx";

export function PerformedTaskDetailModal({ isOpen, onClose, onSubmit, isLoading, performedTask, clients = [], caregivers = [], tasks = [] }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentPerformedTaskData, setCurrentPerformedTaskData] = React.useState(null);
    const formRef = React.useRef();

    // Update current data when performedTask prop changes
    React.useEffect(() => {
        if (performedTask) {
            setCurrentPerformedTaskData(performedTask);
        }
    }, [performedTask]);

    // Reset edit mode when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

    // Enter edit mode
    const handleEnterEditMode = () => {
        if (currentPerformedTaskData) {
            setIsEditMode(true);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        // Force re-render of form with current data
        setCurrentPerformedTaskData({ ...currentPerformedTaskData });
    };

    // Submit changes
    async function handleSubmit(formData) {
        setIsSubmitting(true);
        try {
            if (onSubmit && performedTask) {
                const updatedPerformedTask = await onSubmit(performedTask.id, formData);
                setCurrentPerformedTaskData(updatedPerformedTask);
            }
            setIsEditMode(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleFormSubmit() {
        formRef.current?.submit();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Detail provedeného úkonu</ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[50vh]">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner size="lg" label="Načítání úkonu..." />
                        </div>
                    ) : performedTask ? (
                        <PerformedTaskForm
                            ref={formRef}
                            initialData={currentPerformedTaskData}
                            onSubmit={handleSubmit}
                            isLoading={isSubmitting}
                            isReadOnly={!isEditMode}
                            clients={clients}
                            caregivers={caregivers}
                            tasks={tasks}
                        />
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Úkon nebyl nalezen
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="justify-between">
                    {isEditMode ? (
                        <>
                            <Button
                                variant="bordered"
                                startContent={<X size={16} />}
                                onPress={handleCancelEdit}
                                isDisabled={isSubmitting}
                            >
                                Zrušit
                            </Button>
                            <Button
                                color="primary"
                                startContent={<Save size={16} />}
                                onPress={handleFormSubmit}
                                isLoading={isSubmitting}
                                isDisabled={isSubmitting}
                            >
                                {isSubmitting ? "Ukládání..." : "Uložit změny"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="bordered" onPress={onClose}>
                                Zavřít
                            </Button>
                            <Button
                                color="primary"
                                startContent={<Pencil size={16} />}
                                onPress={handleEnterEditMode}
                            >
                                Upravit
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
