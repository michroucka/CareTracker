import React, {useEffect, useMemo, useState} from "react";
import {useAuth} from "../contexts/AuthContext.tsx";
import {ClientForm} from "../components/forms/ClientForm.jsx";
import {useClients} from "../hooks/useClients.jsx";
import {useNavigate, useParams} from "react-router-dom";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useTasks} from "../hooks/useTasks.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {Button, Spinner} from "@heroui/react";
import {ChevronLeft, Pencil, Save, X} from "lucide-react";


export function ClientDetail() {
    const { clientId } = useParams();
    const [client, setClient] = useState();
    const [currentClientData, setCurrentClientData] = React.useState(null);

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const formRef = React.useRef();
    const {user} = useAuth();
    const {fetchClient, updateClient} = useClients();
    const {departments, fetchDepartments} = useDepartments();
    const {tasks, fetchTasks} = useTasks();
    const {employees, fetchEmployees} = useEmployees();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDepartments({ status: true });
        fetchTasks({ status: true });
        fetchEmployees({ status: true });
    }, [])

    useEffect(() => {
        async function loadClient() {
            setIsLoading(true);
            try {
                const clientData = await fetchClient(Number(clientId));
                setClient(clientData);
            } catch (error) {
                console.error("Failed to fetch client: ", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadClient();
    }, [clientId])

    useEffect(() => {
        if (client) {
            setCurrentClientData(client);
        }
    }, [client]);

    const canEdit = useMemo(() => {
        if (!user) return false;
        const allowedRoles = ["SUPERADMIN", "ADMIN", "COORDINATOR"];

        return allowedRoles.includes(user.role);
    }, [user]);

    // Enter edit mode
    const handleEnterEditMode = () => {
        if (client && canEdit) {
            setIsEditMode(true);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        // Force re-render of form with current data
        setCurrentClientData({ ...currentClientData });
    };

    const handleSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            const updatedClient = await updateClient(Number(clientId), formData);
            setClient(updatedClient);
            setIsEditMode(false);
        } catch (error) {
            console.error("Failed to update client: ", error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleFormSubmit() {
        formRef.current?.submit();
    }

    return (
        <>
            <div className="flex max-lg:justify-between mb-2 lg:mb-0 lg:gap-2">
                <Button
                    variant="flat"
                    startContent={<ChevronLeft size={18} />}
                    onPress={() => navigate(-1)}
                >
                    Zpět
                </Button>

                {!isEditMode && canEdit &&
                    <Button
                        color="primary"
                        startContent={<Pencil size={16} />}
                        onPress={handleEnterEditMode}
                    >
                        Upravit
                    </Button>
                }
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Spinner size="lg" label="Načítání klienta..." />
                </div>
            ) : client ? (
                <>
                    <ClientForm
                        ref={formRef}
                        initialData={currentClientData}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        isReadOnly={!isEditMode}
                        departments={departments}
                        caregivers={employees}
                        tasks={tasks}
                        userDept={user?.departmentId}
                        showTermination={!client.active}
                    />

                    {isEditMode && (
                        <div className="max-w-xl mx-auto flex justify-between mt-6">
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
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    Klient nebyl nalezen
                </div>
            )}
        </>
    )
}