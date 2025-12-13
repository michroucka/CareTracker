import { useState } from "react";
import {getJSON, postJSON} from "../api/api.js";
import { sortByKey } from "../utils/sorting.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import {ClipboardCheck, ClipboardX, CloudAlert} from "lucide-react";
import {showToast} from "../components/MyToast.jsx";

export function usePerformedTasks() {
    const [performedTasks, setPerformedTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPerformedTasks = async () => {
        try {
            setLoading(true);
            const performedTasks = await getJSON("/performed-tasks");

            const sorted = sortByKey(performedTasks, 'date', 'descending');
            setPerformedTasks(sorted);
        } catch (error) {
            console.error("Error fetching performed tasks: ", error);
            showErrorToast(error, "Chyba při načítání provedených úkonů", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
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

    return {
        performedTasks,
        loading,
        fetchPerformedTasks,
        createPerformedTask,
    };
}