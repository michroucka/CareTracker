import React from "react";
import {
    Modal,
    Button, Autocomplete, Label, SearchField, ListBox, FieldError, useFilter, Tooltip, Form,
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
    const {contains} = useFilter({sensitivity: "base"});

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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-1">
                            <Modal.Heading>Vygenerovat stvrzenku</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
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
                                        name="clientId"
                                        value={clientId ? clientId.toString() : null}
                                        onChange={(key) => {
                                            setClientId(key ? parseInt(key) : null);
                                            if (errors.clientId) {
                                                setErrors({ ...errors, clientId: undefined });
                                            }
                                        }}
                                    >
                                        <Label>Klient</Label>
                                        <Autocomplete.Trigger>
                                            <Autocomplete.Value />
                                            <Autocomplete.ClearButton />
                                            <Autocomplete.Indicator />
                                        </Autocomplete.Trigger>
                                        <Autocomplete.Popover>
                                            <Autocomplete.Filter filter={contains}>
                                                <SearchField>
                                                    <SearchField.Group>
                                                        <SearchField.SearchIcon />
                                                        <SearchField.Input placeholder="Hledat..." />
                                                    </SearchField.Group>
                                                </SearchField>
                                                <ListBox>
                                                    {clients.map((client) => (
                                                        <ListBox.Item
                                                            key={client.id.toString()}
                                                            id={client.id.toString()}
                                                            textValue={client.fullName}
                                                        >
                                                            {client.fullName}
                                                            <ListBox.ItemIndicator />
                                                        </ListBox.Item>
                                                    ))}
                                                </ListBox>
                                            </Autocomplete.Filter>
                                        </Autocomplete.Popover>
                                        <FieldError>{errors.clientId}</FieldError>
                                    </Autocomplete>

                                    <MonthYearPicker onChange={({ month, year }) => {setMonth(month); setYear(year)}} />
                                </div>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button
                                className="text-base"
                                type="reset"
                                variant="outline"
                                isDisabled={isLoadingPrint || isLoadingDownload}
                                onPress={resetForm}
                            >
                                Reset
                            </Button>
                            <div className="flex gap-3">
                                <Tooltip delay={0}>
                                    <Tooltip.Trigger>
                                        <Button
                                            isIconOnly
                                            isPending={isLoadingPrint}
                                            isDisabled={isLoadingDownload}
                                            onPress={handlePrint}
                                            variant="ghost"
                                        >
                                            <Printer className="size-6" />
                                        </Button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content>Vytisknout stvrzenku</Tooltip.Content>
                                </Tooltip>
                                <Tooltip delay={0}>
                                    <Tooltip.Trigger>
                                        <Button
                                            isIconOnly
                                            isPending={isLoadingDownload}
                                            isDisabled={isLoadingPrint}
                                            onPress={handleDownload}
                                            variant="ghost"
                                        >
                                            <Download className="size-6" />
                                        </Button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content>Stáhnout stvrzenku</Tooltip.Content>
                                </Tooltip>
                            </div>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
