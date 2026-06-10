import React from "react";
import {
    Modal,
    Button,
    Spinner,
} from "@heroui/react";
import { Save, X, Pencil } from "lucide-react";
import { PerformedTaskForm } from "../../forms/PerformedTaskForm.jsx";

export function PerformedTaskDetailModal({ isOpen, onClose, onSubmit, isLoading, performedTask, clients = [], caregivers = [], tasks = [], readOnly = false }) {
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-1">
                            <Modal.Heading>Detail provedeného úkonu</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center py-8 gap-2">
                                    <Spinner size="lg" />
                                    <p className="text-sm text-foreground/60">Načítání úkonu...</p>
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
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            {!readOnly && isEditMode ? (
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
                                    {!readOnly && (
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
