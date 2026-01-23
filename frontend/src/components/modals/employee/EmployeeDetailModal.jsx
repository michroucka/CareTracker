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
import { ClientForm } from "../../forms/ClientForm.jsx";
import {EmployeeForm} from "../../forms/EmployeeForm.jsx";

export function EmployeeDetailModal({ isOpen, onClose, onSubmit, canEdit, userRole, employee, isLoading, departments = [] }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentEmployeeData, setCurrentEmployeeData] = React.useState(null);
    const formRef = React.useRef();

    // Update current client data when client prop changes
    React.useEffect(() => {
        if (employee) {
            setCurrentEmployeeData(employee);
        }
    }, [employee]);

    // Reset edit mode when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

    // Enter edit mode
    const handleEnterEditMode = () => {
        if (currentEmployeeData && canEdit) {
            setIsEditMode(true);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        // Force re-render of form with current data
        setCurrentEmployeeData({ ...currentEmployeeData });
    };

    // Submit changes
    async function handleSubmit(formData) {
        setIsSubmitting(true);
        try {
            if (onSubmit && employee) {
                const updatedEmployee = await onSubmit(employee.id, formData);
                setCurrentEmployeeData(updatedEmployee);
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
                    Detail zaměstnance
                </ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner size="lg" label="Načítání zaměstnance..." />
                        </div>
                    ) : employee ? (
                        <EmployeeForm
                            ref={formRef}
                            initialData={currentEmployeeData}
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                            isReadOnly={!isEditMode}
                            departments={departments}
                            userRole={userRole}
                        />
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Zaměstnanec nebyl nalezen
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
