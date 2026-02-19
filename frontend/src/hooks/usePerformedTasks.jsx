import {useRef, useState} from "react";
import {getJSON, postJSON, putJSON, deleteJSON} from "../api/api.js";
import { sortByKey } from "../utils/sorting.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import {ClipboardCheck, ClipboardX, CloudAlert, CircleCheck, Trash2} from "lucide-react";
import {showToast} from "../components/MyToast.jsx";
import {calculatePrice} from "../constants/performedTaskConstants.js";

export function usePerformedTasks() {
    const [performedTasks, setPerformedTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef(null);

    const fetchPerformedTasks = async (filters = {}) => {
        // Zruš předchozí request pokud stále běží
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Vytvoř nový AbortController pro tento request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setPerformedTasks([]);
            setLoading(true);

            const params = new URLSearchParams();

            if (filters.organizationId) {
                params.append("organizationId", filters.organizationId);
            }

            if (filters.departmentIds && filters.departmentIds.length > 0) {
                filters.departmentIds.forEach((departmentId) => {
                    params.append("departmentIds", departmentId);
                })
            }

            if (filters.caregiverIds && filters.caregiverIds.length > 0) {
                filters.caregiverIds.forEach((caregiverId) => {
                    params.append("caregiverIds", caregiverId);
                })
            }

            if (filters.month !== undefined) {
                params.append("month", filters.month + 1); // getMonth() je 0-based, backend čeká 1-12
            }

            if (filters.year !== undefined) {
                params.append("year", filters.year);
            }

            const queryString = params.toString();
            const url = queryString ? `/performed-tasks?${queryString}` : "/performed-tasks";
            const performedTasks = await getJSON(url, { signal: controller.signal });

            const sorted = sortByKey(performedTasks, 'date', 'descending');
            setPerformedTasks(sorted);

            setLoading(false);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Request was cancelled");
                return;
            }

            console.error("Error fetching performed tasks: ", error);
            showErrorToast(error, "Chyba při načítání provedených úkonů", { icon: <CloudAlert /> });
            setLoading(false);
        }
    };

    const fetchPerformedTask = async (id) => {
        try {
            const performedTask = await getJSON(`/performed-tasks/${id}`);
            return performedTask;
        } catch (error) {
            console.error("Error fetching performed task: ", error);
            showErrorToast(error, "Úkon nenalezen", { icon: <CloudAlert/>})
            throw error;
        }
    };

    const createPerformedTask = async (performedTaskData) => {
        try {
            const newPerformedTask = await postJSON("/performed-tasks", performedTaskData);

            setPerformedTasks(prev =>
                sortByKey([...prev, newPerformedTask], "date", "descending")
            );

            showToast({
                title: "Úkon úspěšně uložen",
                color: "success",
                icon: <ClipboardCheck />
            });

            return newPerformedTask;
        } catch (err) {
            console.error("Error creating performed tasks: ", err);
            showErrorToast(err, "Chyba při ukládání úkonu", { icon: <ClipboardX /> });
            throw err;
        }
    }

    const updatePerformedTask = async (id, updatedData) => {
        try {
            const updated = await putJSON(`/performed-tasks/${id}`, updatedData);

            // Transformovat PerformedTaskDTO na PerformedTaskSummaryDTO strukturu pro seznam
            const summaryFormat = {
                id: updated.id,
                date: updated.date,
                unitCount: updated.unitCount,
                clientName: updated.client?.fullName,
                taskName: updated.task?.name,
                unitType: updated.task?.unitType,
                price: calculatePrice(updated.task, updated.unitCount),
                department: updated.department,
                caregivers: updated.caregivers
            };

            setPerformedTasks(prev => sortByKey(
                prev.map(task => task.id === id ? summaryFormat : task),
                "date", "descending"
            ));

            showToast({
                title: "Úkon úspěšně aktualizován",
                color: "success",
                icon: <CircleCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error updating performed task:", err);
            showErrorToast(err, "Chyba při aktualizaci úkonu", { icon: <CloudAlert /> });
            throw err;
        }
    };

    const deletePerformedTask = async (id) => {
        try {
            await deleteJSON(`/performed-tasks/${id}`);

            setPerformedTasks(prev => prev.filter(task => task.id !== id));

            showToast({
                title: "Úkon úspěšně odstraněn",
                color: "success",
                icon: <Trash2 />
            });

            return true;
        } catch (err) {
            console.error("Error deleting performed task:", err);
            showErrorToast(err, "Chyba při odstraňování úkonu", { icon: <ClipboardX /> });
            throw err;
        }
    }

    return {
        performedTasks,
        setPerformedTasks,
        loading,
        fetchPerformedTasks,
        fetchPerformedTask,
        createPerformedTask,
        updatePerformedTask,
        deletePerformedTask
    };
}