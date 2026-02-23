import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button, Autocomplete, AutocompleteItem, Tooltip, Form,
} from "@heroui/react";
import {Printer, Download} from "lucide-react";
import MonthYearPicker from "../../MonthYearPicker.jsx";
import {usePerformedTasks} from "../../../hooks/usePerformedTasks.jsx";

export function GenerateReceiptModal({ isOpen, onClose, clients = [] }) {
    const [isLoadingPrint, setIsLoadingPrint] = React.useState(false);
    const [isLoadingDownload, setIsLoadingDownload] = React.useState(false);

    const [clientId, setClientId] = React.useState(null);
    const [month, setMonth] = React.useState(new Date().getMonth());
    const [year, setYear] = React.useState(new Date().getFullYear());
    const [errors, setErrors] = React.useState({});

    const {fetchReceipt} = usePerformedTasks();

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!clientId) newErrors.clientId = "Prosím vyberte klienta";

        return newErrors;
    };

    const handleDownload = async () => {
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoadingDownload(true);
        try {
            const blob = await fetchReceipt(clientId, month, year);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `stvrzenka-${month + 1}-${year}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsLoadingDownload(false);
        }
    };

    const handlePrint = async () => {
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoadingPrint(true);
        try {
            const blob = await fetchReceipt(clientId, month, year);
            const url = URL.createObjectURL(blob);
            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.src = url;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow.print();
            };
        } finally {
            setIsLoadingPrint(false);
        }
    };

    const resetForm = () => {
        setClientId(null);
        setMonth(new Date().getMonth());
        setYear(new Date().getFullYear());
        setErrors({});
    }

    const handleClose = () => {
        resetForm();
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="sm" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Vygenerovat stvrzenku</ModalHeader>
                <ModalBody>
                    <Form
                        className="w-full space-y-4"
                        validationErrors={errors}
                        onReset={resetForm}
                    >
                        <div className="flex flex-col gap-4 w-full">
                            {/* Client Selection */}
                            <Autocomplete
                                isRequired
                                isDisabled={isLoadingPrint || isLoadingDownload}
                                isInvalid={!!errors.clientId}
                                errorMessage={errors.clientId}
                                label="Klient"
                                labelPlacement="inside"
                                name="clientId"
                                selectedKey={clientId ? clientId.toString() : null}
                                onSelectionChange={(key) => {
                                    setClientId(key ? parseInt(key) : null);
                                    if (errors.clientId) {
                                        setErrors({ ...errors, clientId: undefined });
                                    }
                                }}
                            >
                                {clients.map((client) => (
                                    <AutocompleteItem
                                        key={client.id.toString()}
                                        value={client.id.toString()}
                                        textValue={client.fullName}
                                    >
                                        {client.fullName}
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>

                            <MonthYearPicker onChange={({ month, year }) => {setMonth(month); setYear(year)}} />
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        className="text-base"
                        type="reset"
                        variant="bordered"
                        isDisabled={isLoadingPrint || isLoadingDownload}
                        onPress={resetForm}
                    >
                        Reset
                    </Button>
                    <div className="flex gap-3">
                        <Tooltip content="Vytisknout stvrzenku">
                            <Button
                                isIconOnly
                                color="primary"
                                isLoading={isLoadingPrint}
                                isDisabled={isLoadingDownload}
                                onPress={handlePrint}
                                variant="ghost"
                            >
                                <Printer className="size-6" />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Stáhnout stvrzenku">
                            <Button
                                isIconOnly
                                color="primary"
                                isLoading={isLoadingDownload}
                                isDisabled={isLoadingPrint}
                                onPress={handleDownload}
                                variant="ghost"
                            >
                                <Download className="size-6" />
                            </Button>
                        </Tooltip>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
