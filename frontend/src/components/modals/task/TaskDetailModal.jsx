import {
    Modal,
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center">
                            <Modal.Heading>Detail úkonu</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center py-8 gap-2">
                                    <Spinner size="lg" />
                                    <p className="text-sm text-foreground/60">Načítání úkonu...</p>
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
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            {isEditMode ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onPress={handleCancelEdit}
                                        isDisabled={isSubmitting}
                                    ><X size={16} /> Zrušit</Button>
                                    <Button
                                        variant="primary"
                                        onPress={handleFormSubmit}
                                        isPending={isSubmitting}
                                        isDisabled={isSubmitting}
                                    ><Save size={16} /> {isSubmitting ? "Ukládání..." : "Uložit změny"}</Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onPress={onClose}>
                                        Zavřít
                                    </Button>
                                    {canEdit && (
                                        <Button
                                            variant="primary"
                                            onPress={handleEnterEditMode}
                                        ><Pencil size={16} /> Upravit</Button>
                                    )}
                                </>
                            )}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
