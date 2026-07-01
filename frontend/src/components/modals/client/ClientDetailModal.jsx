import {
    Modal,
    Button,
    Spinner,
} from "@heroui/react";
import { Save, Pencil, X } from "lucide-react";
import React from "react";
import { ClientForm } from "../../forms/ClientForm.jsx";

export function ClientDetailModal({ isOpen, onClose, onSubmit, canEdit, client, isLoading, departments = [], caregivers = [], tasks = [] }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentClientData, setCurrentClientData] = React.useState(null);
    const formRef = React.useRef();

    // Update current client data when client prop changes
    React.useEffect(() => {
        if (client) {
            setCurrentClientData(client);
        }
    }, [client]);

    // Reset edit mode when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

    // Enter edit mode
    const handleEnterEditMode = () => {
        if (currentClientData && canEdit) {
            setIsEditMode(true);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        // Force re-render of form with current data
        setCurrentClientData({ ...currentClientData });
    };

    // Submit changes
    async function handleSubmit(formData) {
        setIsSubmitting(true);
        try {
            if (onSubmit && client) {
                const updatedClient = await onSubmit(client.id, formData);
                setCurrentClientData(updatedClient);
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
                    <Modal.Dialog className="max-h-[90dvh] overflow-clip">
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center">
                            <Modal.Heading>Detail klienta</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="overflow-y-auto -mr-6 pr-6">
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center py-8 gap-2">
                                    <Spinner size="lg" />
                                    <p className="text-sm text-foreground/60">Načítání klienta...</p>
                                </div>
                            ) : client ? (
                                <ClientForm
                                    ref={formRef}
                                    initialData={currentClientData}
                                    onSubmit={handleSubmit}
                                    isLoading={isSubmitting}
                                    isReadOnly={!isEditMode}
                                    departments={departments}
                                    caregivers={caregivers}
                                    tasks={tasks}
                                    showTermination={!client.active}
                                />
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Klient nebyl nalezen
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
