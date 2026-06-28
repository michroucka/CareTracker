import { useState } from "react";
import { getJSON, postJSON, putJSON, deleteJSON } from "../api/api.js";
import { toast } from "@heroui/react";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { FileX, FileCheck, FilePlus, FileEdit, Trash2 } from "lucide-react";

export function useIndividualPlan() {
    const [versions, setVersions] = useState([]);
    const [individualPlan, setIndividualPlan] = useState(null);
    const [currentContent, setCurrentContent] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Fetches the version history for a client's individual plan.
     * Returns an empty array when the client has no plan (not an error).
     */
    const fetchVersions = async (clientId) => {
        try {
            const response = await getJSON(`/clients/${clientId}/individual-plan/history`);
            setVersions(response || []);
            return response;
        } catch (error) {
            console.error("Error fetching individual plan history:", error);
            // No plan yet is a valid state, not an error
            setVersions([]);
            return [];
        }
    };

    /**
     * Fetches the current individual plan for a client.
     * Returns null when the client has no plan (404 is treated as a normal "no plan" state).
     */
    const fetchIndividualPlan = async (clientId) => {
        try {
            setLoading(true);
            const response = await getJSON(`/clients/${clientId}/individual-plan`);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            return response;
        } catch (error) {
            // 404 means the client has no plan — treat as empty, not as an error
            if (error.message && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
                setIndividualPlan(null);
                setCurrentContent(null);
                return null;
            }
            console.error("Error fetching individual plan:", error);
            showErrorToast(error, "Chyba při načítání individuálního plánu", { icon: <FileX /> });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches a specific version of a client's individual plan.
     * @param {number} clientId
     * @param {number} versionNumber
     */
    const fetchIndividualPlanByVersion = async (clientId, versionNumber) => {
        try {
            setLoading(true);
            const response = await getJSON(`/clients/${clientId}/individual-plan/${versionNumber}`);
            setCurrentContent(response);
            return response;
        } catch (error) {
            console.error("Error fetching individual plan version:", error);
            showErrorToast(error, "Verze individuálního plánu nenalezena", { icon: <FileX /> });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates the first version of an individual plan for a client.
     * @param {number} clientId
     * @param {Object} data IndividualPlanContentRequestDTO
     */
    const createIndividualPlan = async (clientId, data) => {
        try {
            setLoading(true);
            const response = await postJSON(`/clients/${clientId}/individual-plan`, data);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            toast.success("Individuální plán byl úspěšně vytvořen", { indicator: <FilePlus /> });

            await fetchVersions(clientId);

            return response;
        } catch (error) {
            console.error("Error creating individual plan:", error);
            showErrorToast(error, "Chyba při vytváření individuálního plánu", { icon: <FileX /> });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates a new version of an existing individual plan.
     * The backend auto-increments the version number.
     * @param {number} clientId
     * @param {Object} data IndividualPlanContentRequestDTO
     */
    const updateIndividualPlan = async (clientId, data) => {
        try {
            setLoading(true);
            const response = await putJSON(`/clients/${clientId}/individual-plan`, data);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            toast.success("Nová verze individuálního plánu byla úspěšně vytvořena", { indicator: <FileEdit /> });

            await fetchVersions(clientId);

            return response;
        } catch (error) {
            console.error("Error updating individual plan:", error);
            showErrorToast(error, "Chyba při aktualizaci individuálního plánu", { icon: <FileX /> });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Adds a daily record to a client's individual plan.
     * @param {number} clientId
     * @param {Object} data DailyRecordRequestDTO { date, content }
     */
    const addDailyRecord = async (clientId, data) => {
        try {
            setLoading(true);
            const response = await postJSON(`/clients/${clientId}/individual-plan/daily-records`, data);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            toast.success("Denní záznam byl úspěšně přidán", { indicator: <FileCheck /> });
            return response;
        } catch (error) {
            console.error("Error adding daily record:", error);
            showErrorToast(error, "Chyba při přidávání denního záznamu", { icon: <FileX /> });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Removes a daily record from a client's individual plan.
     * The backend returns the updated IndividualPlanDTO as the response body.
     * @param {number} clientId
     * @param {number} dailyRecordId
     */
    const removeDailyRecord = async (clientId, dailyRecordId) => {
        try {
            setLoading(true);
            const response = await deleteJSON(`/clients/${clientId}/individual-plan/daily-records/${dailyRecordId}`);
            const updatedPlan = await response.json();

            setIndividualPlan(updatedPlan);
            setCurrentContent(updatedPlan?.currentContent || null);

            toast.success("Denní záznam byl úspěšně odstraněn", { indicator: <Trash2 /> });
            return updatedPlan;
        } catch (error) {
            console.error("Error removing daily record:", error);
            showErrorToast(error, "Chyba při odstraňování denního záznamu", { icon: <FileX /> });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /** Resets all hook state, e.g. when the selected client changes. */
    const reset = () => {
        setVersions([]);
        setIndividualPlan(null);
        setCurrentContent(null);
        setLoading(false);
    };

    return {
        versions,
        individualPlan,
        currentContent,
        loading,
        fetchVersions,
        fetchIndividualPlan,
        fetchIndividualPlanByVersion,
        createIndividualPlan,
        updateIndividualPlan,
        addDailyRecord,
        removeDailyRecord,
        reset,
    };
}
