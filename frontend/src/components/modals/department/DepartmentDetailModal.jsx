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
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader>Detail střediska</ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner size="lg" label="Načítání střediska..." />
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
                </ModalBody>
                <ModalFooter className="justify-between">
                    {isEditMode ? (
                        <>
                            <Button variant="bordered" startContent={<X size={16} />} onPress={handleCancelEdit} isDisabled={isSubmitting}>
                                Zrušit
                            </Button>
                            <Button color="primary" startContent={<Save size={16} />} onPress={() => formRef.current?.submit()} isLoading={isSubmitting} isDisabled={isSubmitting}>
                                {isSubmitting ? "Ukládání..." : "Uložit změny"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="bordered" onPress={onClose}>Zavřít</Button>
                            <Button color="primary" startContent={<Pencil size={16} />} onPress={() => setIsEditMode(true)} isDisabled={!department}>
                                Upravit
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
