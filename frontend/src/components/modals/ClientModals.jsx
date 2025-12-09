import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Checkbox,
    Link
} from "@heroui/react";
import {Plus} from "lucide-react";

export function ClientCreateModal({ isOpen, onClose, onSubmit }) {
    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
               backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Přidat nového klienta</ModalHeader>
                        <ModalBody>
                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                variant="bordered"
                            />
                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                type="password"
                                variant="bordered"
                            />
                            <div className="flex py-2 px-1 justify-between">
                                <Checkbox
                                    classNames={{
                                        label: "text-small",
                                    }}
                                >
                                    Remember me
                                </Checkbox>
                                <Link color="primary" href="#" size="sm">
                                    Forgot password?
                                </Link>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" variant="flat" onPress={onClose}>
                                Zrušit
                            </Button>
                            <Button color="primary"
                                    onPress={() => onSubmit(formData)}
                                    endContent={ <Plus className="size-4" /> }
                            >
                                Přidat
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
