import { useState } from "react";
import {getJSON, postJSON, putJSON, deleteJSON} from "../api/api.js";
import { sortByKey } from "../utils/sorting.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import {ClipboardCheck, ClipboardX, CloudAlert, CircleCheck, Trash2} from "lucide-react";
import {showToast} from "../components/MyToast.jsx";

export function usePerformedTasks() {
    const [performedTasks, setPerformedTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPerformedTasks = async (organizationId = null) => {
        try {
            setLoading(true);
            const url = organizationId
                ? `/performed-tasks?organizationId=${organizationId}`
                : '/performed-tasks';
            const performedTasks = await getJSON(url);

            const sorted = sortByKey(performedTasks, 'date', 'descending');
            setPerformedTasks(sorted);
        } catch (error) {
            console.error("Error fetching performed tasks: ", error);
            showErrorToast(error, "Chyba při načítání provedených úkonů", { icon: <CloudAlert /> });
        } finally {
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

            setPerformedTasks(prev => sortByKey(
                prev.map(task => task.id === id ? updated : task),
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