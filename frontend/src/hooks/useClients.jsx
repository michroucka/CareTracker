import React, { useState, useRef } from "react";
import {getJSON, postJSON, putJSON} from "../api/api.js";
import { savePicture } from "@/lib/pictures";
import { toast } from "@/components/ui/sonner";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { sortByKey } from "../utils/sorting.js";

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef(null);
    // null until a list is loaded: the detail page uses the mutations too and has no list to refresh
    const filtersRef = useRef(null);

    const reloadListIfShown = () => {
        if (filtersRef.current) fetchClients(filtersRef.current, { silent: true });
    };

    function mapClient(client) {
        return {
            ...client,
            fullName: `${client.firstName} ${client.lastName}`,
            address: `${client.street}, ${client.city}`,
        };
    }

    function mapClients(clients) {
        return clients.map((client) => mapClient(client));
    }

    const fetchClients = async (filters = {}, { silent = false } = {}) => {
        // Abort any in-flight request before starting a new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            filtersRef.current = filters;
            if (!silent) {
                setClients([]);
                setLoading(true);
            }

            const params = new URLSearchParams();

            if (filters.organizationId) {
                params.append("organizationId", filters.organizationId);
            }

            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
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

            const queryString = params.toString();
            const url = queryString ? `/clients?${queryString}` : "/clients";
            const clients = await getJSON(url, { signal: controller.signal });

            const mappedClients = mapClients(clients);
            const sorted = sortByKey(mappedClients, 'lastName', 'ascending');
            setClients(sorted);

            if (!silent) setLoading(false);
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("Request was cancelled");
                return;
            }

            console.error("Error fetching clients: ", err);
            showErrorToast(err, "Chyba při načítání klientů");
            if (!silent) setLoading(false);
        }
    };

    const fetchClient = async (id) => {
        try {
            return mapClient(await getJSON(`/clients/${id}`));
        } catch (err) {
            console.error("Error fetching client:", err);
            showErrorToast(err, "Klient nenalezen");
            throw err;
        }
    };

    const createClient = async (clientData) => {
        try {
            const { picture, ...clientDataWithoutPicture } = clientData;
            const newClient = await postJSON("/clients", clientDataWithoutPicture);
            newClient.pictureId = await savePicture("clients", newClient.id, picture, null);

            setClients(prev => sortByKey([...prev, mapClient(newClient)], 'lastName', 'ascending'));
            toast.success("Klient úspěšně vytvořen");

            return newClient;
        } catch (err) {
            console.error("Error creating client:", err);
            showErrorToast(err, "Chyba při vytváření klienta");
            throw err;
        }
    };

    const updateClient = async (id, updatedData) => {
        try {
            const { picture, ...updatedDataWithoutPicture } = updatedData;
            const updated = await putJSON(`/clients/${id}`, updatedDataWithoutPicture);
            updated.pictureId = await savePicture("clients", id, picture, updated.pictureId);

            reloadListIfShown();
            toast.success("Klient úspěšně aktualizován");

            return mapClient(updated);
        } catch (err) {
            console.error("Error updating client:", err);
            showErrorToast(err, "Chyba při aktualizaci klienta");
            throw err;
        }
    };

    const terminateClient = async (id, data) => {
        try {
            const updated = await putJSON(`/clients/${id}/terminate`, data);

            reloadListIfShown();

            toast.success("Klient úspěšně deaktivován");

            return updated;
        } catch (err) {
            console.error("Error terminating client:", err);
            showErrorToast(err, "Chyba při deaktivaci klienta");
            throw err;
        }
    };

    const createClientAccount = async (clientId, email) => {
        try {
            const result = await postJSON(`/clients/${clientId}/account/create?email=${encodeURIComponent(email)}`);

            reloadListIfShown();

            (result.success ? toast.success : toast.error)(result.message);
        } catch (err) {
            console.error("Error creating client account:", err);
            showErrorToast(err, "Chyba při vytváření účtu");
            throw err;
        }
    };

    const deactivateClientAccount = async (clientId) => {
        try {
            await putJSON(`/clients/${clientId}/account/deactivate`);

            reloadListIfShown();

            toast.success("Účet klienta byl deaktivován");
        } catch (err) {
            console.error("Error deactivating client account:", err);
            showErrorToast(err, "Chyba při deaktivaci účtu");
            throw err;
        }
    };

    const activateClientAccount = async (clientId) => {
        try {
            await putJSON(`/clients/${clientId}/account/activate`);

            reloadListIfShown();

            toast.success("Účet klienta byl aktivován");
        } catch (err) {
            console.error("Error activating client account:", err);
            showErrorToast(err, "Chyba při aktivaci účtu");
            throw err;
        }
    };

    const resendClientActivation = async (clientId) => {
        try {
            const result = await postJSON(`/clients/${clientId}/account/resend`);

            (result.success ? toast.success : toast.error)(result.message);
        } catch (err) {
            console.error("Error resending client activation email:", err);
            showErrorToast(err, "Chyba při odesílání aktivačního emailu");
            throw err;
        }
    };

    const activateClient = async (id) => {
        try {
            const updated = await putJSON(`/clients/${id}/activate`);

            reloadListIfShown();

            toast.success("Klient úspěšně aktivován");

            return updated;
        } catch (err) {
            console.error("Error activating client:", err);
            showErrorToast(err, "Chyba při aktivaci klienta");
            throw err;
        }
    }

    return {
        clients,
        setClients,
        loading,
        fetchClients,
        fetchClient,
        createClient,
        updateClient,
        terminateClient,
        activateClient,
        createClientAccount,
        deactivateClientAccount,
        activateClientAccount,
        resendClientActivation
    };
}
