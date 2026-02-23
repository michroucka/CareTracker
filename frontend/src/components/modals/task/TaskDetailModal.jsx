import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner,
} from "@heroui/react";
import { Save, Pencil, X } from "lucide-react";
import React from "react";
import {TaskForm} from "../../forms/TaskForm.jsx";

export function TaskDetailModal({ isOpen, onClose, onSubmit, canEdit, task, isLoading}) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentTaskData, setCurrentTaskData] = React.useState(null);
    const formRef = React.useRef();

    // Update current task data when task prop changes
    React.useEffect(() => {
        if (task) {
            setCurrentTaskData(task);
        }
    }, [task]);

    // Reset edit mode when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

    // Enter edit mode
    const handleEnterEditMode = () => {
        if (currentTaskData && canEdit) {
            setIsEditMode(true);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        // Force re-render of form with current data
        setCurrentTaskData({ ...currentTaskData });
    };

    // Submit changes
    async function handleSubmit(formData) {
        setIsSubmitting(true);
        try {
            if (onSubmit && task) {
                const updatedTask = await onSubmit(task.id, formData);
                setCurrentTaskData(updatedTask);
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    Detail úkonu
                </ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner size="lg" label="Načítání úkonu..." />
                        </div>
                    ) : task ? (
                        <TaskForm
                            ref={formRef}
                            initialData={currentTaskData}
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                            isReadOnly={!isEditMode}
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
                            {canEdit && (
                                <Button
                                    color="primary"
                                    startContent={<Pencil size={16} />}
                                    onPress={handleEnterEditMode}
                                >
                                    Upravit
                                </Button>
                            )}
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
