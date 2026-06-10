import {
    Modal,
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center">
                            <Modal.Heading>Detail zaměstnance</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center py-8 gap-2">
                                    <Spinner size="lg" />
                                    <p className="text-sm text-foreground/60">Načítání zaměstnance...</p>
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
