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
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader>Detail organizace</ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner size="lg" label="Načítání organizace..." />
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
                            <Button color="primary" startContent={<Pencil size={16} />} onPress={() => setIsEditMode(true)} isDisabled={!organization}>
                                Upravit
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
