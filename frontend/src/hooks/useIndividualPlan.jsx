import { useState } from "react";
import { getJSON, postJSON, putJSON, deleteJSON } from "../api/api.js";
import { showToast } from "../components/MyToast.jsx";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { FileX, FileCheck, FilePlus, FileEdit, Trash2 } from "lucide-react";

export function useIndividualPlan() {
    const [versions, setVersions] = useState([]);
    const [individualPlan, setIndividualPlan] = useState(null);
    const [currentContent, setCurrentContent] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Načte historii verzí individuálního plánu
     * Vrací prázdné pole, pokud klient nemá žádný IP
     */
    const fetchVersions = async (clientId) => {
        try {
            const response = await getJSON(`/clients/${clientId}/individual-plan/history`);
            setVersions(response || []);
            return response;
        } catch (error) {
            console.error("Error fetching individual plan history:", error);
            // Pokud IP neexistuje, není to chyba - jen prázdná historie
            setVersions([]);
            return [];
        }
    };

    /**
     * Načte aktuální individuální plán klienta
     * Vrací null pokud klient nemá IP (status 404)
     */
    const fetchIndividualPlan = async (clientId) => {
        try {
            setLoading(true);
            const response = await getJSON(`/clients/${clientId}/individual-plan`);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            return response;
        } catch (error) {
            // 404 = klient nemá IP, není to chyba
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
     * Načte konkrétní verzi individuálního plánu
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
     * Vytvoří první verzi individuálního plánu pro klienta
     * @param {number} clientId - ID klienta
     * @param {object} data - IndividualPlanContentRequestDTO
     */
    const createIndividualPlan = async (clientId, data) => {
        try {
            setLoading(true);
            const response = await postJSON(`/clients/${clientId}/individual-plan`, data);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            showToast({ title: "Individuální plán byl úspěšně vytvořen", icon: <FilePlus />, color: "success" });

            // Refresh historie verzí
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
     * Vytvoří novou verzi individuálního plánu
     * Backend automaticky vytvoří novou verzi s incrementovaným číslem
     * @param {number} clientId - ID klienta
     * @param {object} data - IndividualPlanContentRequestDTO
     */
    const updateIndividualPlan = async (clientId, data) => {
        try {
            setLoading(true);
            const response = await putJSON(`/clients/${clientId}/individual-plan`, data);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            showToast({ title: "Nová verze individuálního plánu byla úspěšně vytvořena", icon: <FileEdit />, color: "success" });

            // Refresh historie verzí
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
     * Přidá denní záznam k individuálnímu plánu
     * @param {number} clientId - ID klienta
     * @param {object} data - DailyRecordRequestDTO { date, content }
     */
    const addDailyRecord = async (clientId, data) => {
        try {
            setLoading(true);
            const response = await postJSON(`/clients/${clientId}/individual-plan/daily-records`, data);
            setIndividualPlan(response);
            setCurrentContent(response?.currentContent || null);
            showToast({ title: "Denní záznam byl úspěšně přidán", icon: <FileCheck />, color: "success" });
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
     * Odstraní denní záznam z individuálního plánu
     * @param {number} clientId - ID klienta
     * @param {number} dailyRecordId - ID denního záznamu
     */
    const removeDailyRecord = async (clientId, dailyRecordId) => {
        try {
            setLoading(true);
            // Backend vrací updatovaný IndividualPlanDTO
            const response = await deleteJSON(`/clients/${clientId}/individual-plan/daily-records/${dailyRecordId}`);
            const updatedPlan = await response.json();

            setIndividualPlan(updatedPlan);
            setCurrentContent(updatedPlan?.currentContent || null);

            showToast({ title: "Denní záznam byl úspěšně odstraněn", icon: <Trash2 />, color: "success" });
            return updatedPlan;
        } catch (error) {
            console.error("Error removing daily record:", error);
            showErrorToast(error, "Chyba při odstraňování denního záznamu", { icon: <FileX /> });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Resetuje stav hooku (užitečné při změně klienta)
     */
    const reset = () => {
        setVersions([]);
        setIndividualPlan(null);
        setCurrentContent(null);
        setLoading(false);
    };

    return {
        // State
        versions,
        individualPlan,
        currentContent,
        loading,

        // Methods
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