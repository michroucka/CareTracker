import {
    Modal,
    Button,
    Spinner,
} from "@heroui/react";
import { Save, Pencil, X } from "lucide-react";
import React from "react";
import {OrganizationForm} from "../../forms/OrganizationForm.jsx";

export function OrganizationDetailModal({ isOpen, onClose, onSubmit, organization, isLoading, employees = [] }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentData, setCurrentData] = React.useState(null);
    const formRef = React.useRef();

    React.useEffect(() => {
        if (organization) setCurrentData(organization);
    }, [organization]);

    React.useEffect(() => {
        if (!isOpen) setIsEditMode(false);
    }, [isOpen]);

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setCurrentData(o => ({ ...o }));
    };

    async function handleSubmit(formData) {
        setIsSubmitting(true);
        try {
            const updated = await onSubmit?.(organization.id, formData);
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
                            <Modal.Heading>Detail organizace</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center py-8 gap-2">
                                    <Spinner size="lg" />
                                    <p className="text-sm text-foreground/60">Načítání organizace...</p>
                                </div>
                            ) : organization ? (
                                <OrganizationForm
                                    ref={formRef}
                                    initialData={currentData}
                                    onSubmit={handleSubmit}
                                    isLoading={isSubmitting}
                                    isReadOnly={!isEditMode}
                                    employees={employees}
                                />
                            ) : (
                                <div className="text-center py-8 text-foreground/50">
                                    Organizace nebyla nalezena
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
                                    <Button variant="primary" onPress={() => setIsEditMode(true)} isDisabled={!organization}><Pencil size={16} /> Upravit</Button>
                                </>
                            )}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
