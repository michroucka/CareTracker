import {
    Modal,
    Button,
    Spinner,
} from "@heroui/react";
import { Save, Pencil, X } from "lucide-react";
import React from "react";
import { DepartmentForm } from "../../forms/DepartmentForm.jsx";

export function DepartmentDetailModal({ isOpen, onClose, onSubmit, department, isLoading, employees = [], organizationId = null }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentData, setCurrentData] = React.useState(null);
    const formRef = React.useRef();

    React.useEffect(() => {
        if (department) setCurrentData(department);
    }, [department]);

    React.useEffect(() => {
        if (!isOpen) setIsEditMode(false);
    }, [isOpen]);

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setCurrentData(d => ({ ...d }));
    };

    async function handleSubmit(formData) {
        setIsSubmitting(true);
        try {
            const updated = await onSubmit?.(department.id, formData);
            if (updated) setCurrentData(updated);
            setIsEditMode(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>Detail střediska</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center py-8 gap-2">
                                    <Spinner size="lg" />
                                    <p className="text-sm text-foreground/60">Načítání střediska...</p>
                                </div>
                            ) : department ? (
                                <DepartmentForm
                                    ref={formRef}
                                    initialData={currentData}
                                    onSubmit={handleSubmit}
                                    isLoading={isSubmitting}
                                    isReadOnly={!isEditMode}
                                    employees={employees}
                                    organizationId={organizationId}
                                />
                            ) : (
                                <div className="text-center py-8 text-foreground/50">
                                    Středisko nebylo nalezeno
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            {isEditMode ? (
                                <>
                                    <Button variant="outline" onPress={handleCancelEdit} isDisabled={isSubmitting}><X size={16} /> Zrušit</Button>
                                    <Button variant="primary" onPress={() => formRef.current?.submit()} isPending={isSubmitting} isDisabled={isSubmitting}><Save size={16} /> {isSubmitting ? "Ukládání..." : "Uložit změny"}</Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onPress={onClose}>Zavřít</Button>
                                    <Button variant="primary" onPress={() => setIsEditMode(true)} isDisabled={!department}><Pencil size={16} /> Upravit</Button>
                                </>
                            )}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
