import {useRef, useState} from "react";
import {getJSON, postJSON, putJSON} from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import {Building2, CloudAlert} from "lucide-react";
import { sortByKey } from "../utils/sorting.js";
import {showToast} from "../components/MyToast.jsx";

export function useOrganizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef(null);
    const filtersRef = useRef({});

    const fetchOrganizations = async (filters = {}, { silent = false } = {}) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            filtersRef.current = filters;
            if (!silent) {
                setOrganizations([]);
                setLoading(true);
            }

            const params = new URLSearchParams();

            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
            }

            const queryString = params.toString();
            const url = queryString ? `/organizations?${queryString}` : "/organizations";
            const organizations = await getJSON(url, { signalL: controller.signal });
            const sorted = sortByKey(organizations, 'name', 'ascending');
            setOrganizations(sorted);
            if (!silent) setLoading(false);
        } catch (err) {
            console.error("Error fetching organizations:", err);
            showErrorToast(err, "Chyba při načítání organizací", { icon: <CloudAlert /> });
            if (!silent) setLoading(false);
        }
    };

    const fetchOrganization = async (id) => {
        try {
            return await getJSON(`/organizations/${id}`);
        } catch (err) {
            console.error("Error fetching organization:", err);
            showErrorToast(err, "Organizace nenalezena", { icon: <Building2 /> });
            throw err;
        }
    };

    const createOrganization = async (data) => {
        try {
            const created = await postJSON("/organizations", data);

            setOrganizations(prev => sortByKey([...prev, created], 'name', 'ascending'));

            showToast({ title: "Organizace úspěšně vytvořena", color: "success", icon: <Building2 /> });

            return created;
        } catch (err) {
            console.error("Error creating organization:", err);
            showErrorToast(err, "Chyba při vytváření organizace", { icon: <Building2 /> });
            throw err;
        }
    };

    const updateOrganization = async (id, data) => {
        try {
            const updated = await putJSON(`/organizations/${id}`, data);

            fetchOrganizations(filtersRef.current, { silent: true });

            showToast({ title: "Organizace úspěšně aktualizována", color: "success", icon: <Building2 /> });

            return updated;
        } catch (err) {
            console.error("Error updating organization:", err);
            showErrorToast(err, "Chyba při aktualizaci organizace", { icon: <Building2 /> });
            throw err;
        }
    };

    const terminateOrganization = async (id) => {
        try {
            const updated = await putJSON(`/organizations/${id}/terminate`);

            fetchOrganizations(filtersRef.current, { silent: true });

            showToast({ title: "Organizace úspěšně deaktivována", color: "success", icon: <Building2 /> });

            return updated;
        } catch (err) {
            console.error("Error terminating organization:", err);
            showErrorToast(err, "Chyba při deaktivaci organizace", { icon: <Building2 /> });
            throw err;
        }
    };

    const activateOrganization = async (id) => {
        try {
            const updated = await putJSON(`/organizations/${id}/activate`);

            fetchOrganizations(filtersRef.current, { silent: true });

            showToast({ title: "Organizace úspěšně aktivována", color: "success", icon: <Building2 /> });

            return updated;
        } catch (err) {
            console.error("Error activating organization:", err);
            showErrorToast(err, "Chyba při aktivaci organizace", { icon: <Building2 /> });
            throw err;
        }
    };

    return {
        organizations,
        setOrganizations,
        loading,
        fetchOrganizations,
        fetchOrganization,
        createOrganization,
        updateOrganization,
        terminateOrganization,
        activateOrganization,
    };
}
