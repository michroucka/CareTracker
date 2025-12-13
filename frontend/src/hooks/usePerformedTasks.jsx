import { useState } from "react";
import { getJSON } from "../api/api.js";
import { sortByKey } from "../utils/sorting.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";

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

    return {
        performedTasks,
        loading,
        fetchPerformedTasks,
    };
}