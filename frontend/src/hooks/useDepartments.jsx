import { useRef, useState } from "react";
import { getJSON, postJSON, putJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { Building2, CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";
import { showToast } from "../components/MyToast.jsx";

export function useDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef(null);
    const filtersRef = useRef({});

    const fetchDepartments = async (filters = {}, { silent = false } = {}) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            filtersRef.current = filters;
            if (!silent) {
                setDepartments([]);
                setLoading(true);
            }

            const params = new URLSearchParams();

            if (filters.organizationId) {
                params.append("organizationId", filters.organizationId);
            }
            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
            }

            const queryString = params.toString();
            const url = queryString ? `/departments?${queryString}` : "/departments";
            const data = await getJSON(url, { signal: controller.signal });

            setDepartments(sortByKey(data, 'city', 'ascending'));
            if (!silent) setLoading(false);
        } catch (err) {
            if (err.name === 'AbortError') return;

            console.error("Error fetching departments:", err);
            showErrorToast(err, "Chyba při načítání střediska", { icon: <CloudAlert /> });
            if (!silent) setLoading(false);
        }
    };

    const fetchDepartment = async (id) => {
        try {
            return await getJSON(`/departments/${id}`);
        } catch (err) {
            console.error("Error fetching department:", err);
            showErrorToast(err, "Středisko nenalezeno", { icon: <Building2 /> });
            throw err;
        }
    };

    const createDepartment = async (data) => {
        try {
            const created = await postJSON("/departments", data);

            setDepartments(prev => sortByKey([...prev, created], 'city', 'ascending'));

            showToast({ title: "Středisko úspěšně vytvořeno", color: "success", icon: <Building2 /> });

            return created;
        } catch (err) {
            console.error("Error creating department:", err);
            showErrorToast(err, "Chyba při vytváření střediska", { icon: <Building2 /> });
            throw err;
        }
    };

    const updateDepartment = async (id, data) => {
        try {
            const updated = await putJSON(`/departments/${id}`, data);

            fetchDepartments(filtersRef.current, { silent: true });

            showToast({ title: "Středisko úspěšně aktualizováno", color: "success", icon: <Building2 /> });

            return updated;
        } catch (err) {
            console.error("Error updating department:", err);
            showErrorToast(err, "Chyba při aktualizaci střediska", { icon: <Building2 /> });
            throw err;
        }
    };

    const terminateDepartment = async (id) => {
        try {
            const updated = await putJSON(`/departments/${id}/terminate`);

            fetchDepartments(filtersRef.current, { silent: true });

            showToast({ title: "Středisko úspěšně deaktivováno", color: "success", icon: <Building2 /> });

            return updated;
        } catch (err) {
            console.error("Error terminating department:", err);
            showErrorToast(err, "Chyba při deaktivaci střediska", { icon: <Building2 /> });
            throw err;
        }
    };

    const activateDepartment = async (id) => {
        try {
            const updated = await putJSON(`/departments/${id}/activate`);

            fetchDepartments(filtersRef.current, { silent: true });

            showToast({ title: "Středisko úspěšně aktivováno", color: "success", icon: <Building2 /> });

            return updated;
        } catch (err) {
            console.error("Error activating department:", err);
            showErrorToast(err, "Chyba při aktivaci střediska", { icon: <Building2 /> });
            throw err;
        }
    };

    return {
        departments,
        setDepartments,
        loading,
        fetchDepartments,
        fetchDepartment,
        createDepartment,
        updateDepartment,
        terminateDepartment,
        activateDepartment,
    };
}
