import React, {useEffect} from "react";
import {useAuth} from "../contexts/AuthContext.tsx";
import {ClientForm} from "../components/forms/ClientForm.jsx";
import {useClients} from "../hooks/useClients.jsx";
import {useNavigate} from "react-router-dom";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useTasks} from "../hooks/useTasks.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {Button} from "@heroui/react";
import {ChevronLeft, Save} from "lucide-react";


export function ClientCreate() {
    const [isLoading, setIsLoading] = React.useState(false);
    const formRef = React.useRef();
    const {user} = useAuth();
    const {createClient} = useClients();
    const {departments, fetchDepartments} = useDepartments();
    const {tasks, fetchTasks} = useTasks();
    const {employees, fetchEmployees} = useEmployees();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDepartments({ status: true });
        fetchTasks({ status: true });
        fetchEmployees({ status: true });
    }, [])

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const newClient = await createClient(formData);
            navigate(`/clients/${newClient.id}`)
        } catch (error) {
            console.error("Failed to create client: ", error);
            throw error;
        } finally {
            setIsLoading(false);
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
            </div>

            <ClientForm
                ref={formRef}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                departments={departments}
                caregivers={employees}
                tasks={tasks}
                userDept={user?.departmentId}
            />

            <div className="max-w-xl mt-6 mx-auto">
                <Button
                    color="primary"
                    startContent={<Save size={16} />}
                    onPress={handleFormSubmit}
                    isLoading={isLoading}
                    isDisabled={isLoading}
                    className="w-full"
                >
                    {isLoading ? "Ukládání..." : "Uložit změny"}
                </Button>
            </div>
        </>

    )
}