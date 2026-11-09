import React from "react";
import { useNavigate } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useClients } from "../hooks/useClients.jsx";
import { useDepartments } from "../hooks/useDepartments.jsx";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { useTasks } from "../hooks/useTasks.jsx";
import { useRecordForm } from "../hooks/useRecordForm";
import { ClientFields } from "@/components/clients/ClientFields";
import { emptyClient, toRequest, validateClient } from "@/components/clients/clientForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export function ClientCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const form = useRecordForm(emptyClient(user.departmentId));

    const { createClient } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();
    const { tasks, fetchTasks } = useTasks();

    React.useEffect(() => {
        fetchDepartments({ status: true });
        fetchEmployees({ status: true });
        fetchTasks({ status: true });
        // options are loaded once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = (event) => {
        event.preventDefault();
        form.submit(validateClient, async (values) => {
            const created = await createClient(toRequest(values));
            navigate(`/clients/${created.id}`, { replace: true });
        });
    };

    return (
        <form noValidate onSubmit={save} className="mx-auto grid w-full max-w-3xl gap-6">
            <PageHeader title="Nový klient" description="Pole s hvězdičkou jsou povinná. Ostatní můžete doplnit později." />
            <ClientFields
                idPrefix="client-create"
                values={form.values}
                errors={form.errors}
                onChange={form.setField}
                disabled={form.isSubmitting}
                shakeSignal={form.submitCount}
                departments={departments}
                caregivers={employees}
                tasks={tasks}
            />
            <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t bg-background/90 px-1 py-4 backdrop-blur">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={form.isSubmitting}>Zrušit</Button>
                <Button type="submit" disabled={form.isSubmitting}>
                    {form.isSubmitting && <IconLoader2 className="animate-spin" />}
                    {form.isSubmitting ? "Ukládám…" : "Vytvořit klienta"}
                </Button>
            </div>
        </form>
    );
}
