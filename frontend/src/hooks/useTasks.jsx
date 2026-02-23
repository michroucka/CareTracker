import {useRef, useState} from "react";
import {getJSON, postJSON, putJSON} from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import {ClipboardCheck, ClipboardX, CloudAlert, UserRoundCheck, UserRoundX} from "lucide-react";
import { sortByKey } from "../utils/sorting.js";
import {showToast} from "../components/MyToast.jsx";

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef(null);

    const fetchTasks = async (filters = {}) => {
        // Zruš předchozí request pokud stále běží
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Vytvoř nový AbortController pro tento request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setTasks([])
            setLoading(true);

            const params = new URLSearchParams();

            if (filters.organizationId) {
                params.append("organizationId", filters.organizationId);
            }

            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
            }

            const queryString = params.toString();
            const url = queryString ? `/tasks?${queryString}` : "/tasks";
            const tasks = await getJSON(url, { signal: controller.signal });

            const sorted = sortByKey(tasks, 'name', 'ascending');
            setTasks(sorted);

            setLoading(false);
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("Request was cancelled");
                return;
            }

            console.error("Error fetching tasks:", err);
            showErrorToast(err, "Chyba při načítání úkolů", { icon: <CloudAlert /> });
            setLoading(false);
        }
    };

    const fetchTask = async (id) => {
        try {
            return await getJSON(`/tasks/${id}`);
        } catch (error) {
            console.error("Error fetching task: ", error);
            showErrorToast(error, "Úkon nenalezen", { icon: <ClipboardX /> })
            throw error;
        }
    };

    const createTask = async (taskData) => {
        try {
            const newTask = await postJSON("/tasks", taskData);

            setTasks(prev =>
                sortByKey([...prev, newTask], 'name', 'ascending')
            );

            showToast({
                title: "Úkon úspěšně vytvořen",
                color: "success",
                icon: <ClipboardCheck />
            });

            return newTask;
        } catch (err) {
            console.error("Error creating task:", err);
            showErrorToast(err, "Chyba při vytváření úkonu", { icon: <ClipboardX /> });
            throw err;
        }
    };

    const updateTask = async (id, updatedData) => {
        try {
            const updated = await putJSON(`/tasks/${id}`, updatedData);

            setTasks(prev => sortByKey(
                prev.map(employee => employee.id === id ? updated : employee),
                'name', 'ascending'
            ));

            showToast({
                title: "Úkon úspěšně aktualizován",
                color: "success",
                icon: <ClipboardCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error updating task:", err);
            showErrorToast(err, "Chyba při aktualizaci úkonu", { icon: <ClipboardX /> });
            throw err;
        }
    };

    const terminateTask = async (id) => {
        try {
            const updated = await putJSON(`/tasks/${id}/terminate`);

            setTasks(prev => sortByKey(
                prev.map(employee => employee.id === id ? updated : employee),
                'name', 'ascending'
            ));

            showToast({
                title: "Úkon úspěšně deaktivován",
                color: "success",
                icon: <ClipboardCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error terminating task:", err);
            showErrorToast(err, "Chyba při deaktivaci úkonu", { icon: <ClipboardX /> });
            throw err;
        }
    };

    const activateTask = async (id) => {
        try {
            const updated = await putJSON(`/tasks/${id}/activate`);

            setTasks(prev => sortByKey(
                prev.map(employee => employee.id === id ? updated : employee),
                'name',
                'ascending'
            ));

            showToast({
                title: "Úkon úspěšně aktivován",
                color: "success",
                icon: <ClipboardCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error activating task:", err);
            showErrorToast(err, "Chyba při aktivaci úkonu", { icon: <ClipboardX /> });
            throw err;
        }
    };

    return {
        tasks,
        setTasks,
        loading,
        fetchTasks,
        fetchTask,
        createTask,
        updateTask,
        terminateTask,
        activateTask,
    };
}
