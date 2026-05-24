import React, { useState, useRef } from "react";
import {getJSON, postJSON, putJSON, uploadFile, fetchImage, deleteImage} from "../api/api.js";
import { showToast } from "../components/MyToast.jsx";
import { showErrorToast } from "../utils/errorHandler.jsx";
import {CloudAlert, MailCheck, MailX, UserRoundCheck, UserRoundX} from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef(null);
    const filtersRef = useRef({});

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
            showErrorToast(err, "Chyba při načítání klientů", { icon: <CloudAlert /> });
            if (!silent) setLoading(false);
        }
    };

    const fetchClient = async (id) => {
        try {
            const client = await getJSON(`/clients/${id}`);

            if (client.hasPicture) {
                try {
                    const imageUrl = await fetchImage(`/clients/${id}/picture`);
                    client.pictureUrl = imageUrl;
                } catch (imgErr) {
                    console.error("Error fetching client picture:", imgErr);
                    client.pictureUrl = null;
                }
            }

            return mapClient(client);
        } catch (err) {
            console.error("Error fetching client:", err);
            showErrorToast(err, "Klient nenalezen", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const createClient = async (clientData) => {
        try {
            // Separate picture from the rest of the data — picture is uploaded separately after creation
            const { picture, ...clientDataWithoutPicture } = clientData;

            const newClient = await postJSON("/clients", clientDataWithoutPicture);

            if (picture && picture instanceof File) {
                try {
                    await uploadFile(`/clients/${newClient.id}/picture`, picture);
                } catch (uploadErr) {
                    console.error("Error uploading picture:", uploadErr);
                    showToast({
                        title: "Klient vytvořen, ale obrázek se nenahrál",
                        description: "Můžete ho nahrát později při editaci",
                        color: "warning",
                    });
                }
            }

            const mappedClient = mapClient(newClient);

            setClients(prev =>
                sortByKey([...prev, mappedClient], 'lastName', 'ascending')
            );

            showToast({
                title: "Klient úspěšně vytvořen",
                color: "success",
                icon: <UserRoundCheck />
            });

            return newClient;
        } catch (err) {
            console.error("Error creating client:", err);
            showErrorToast(err, "Chyba při vytváření klienta", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const updateClient = async (id, updatedData) => {
        try {
            // Separate picture — it is handled via a dedicated upload/delete endpoint
            const { picture, ...updatedDataWithoutPicture } = updatedData;

            const updated = await putJSON(`/clients/${id}`, updatedDataWithoutPicture);

            // "DELETE" is a sentinel value set by the UI to request picture removal
            if (picture === "DELETE") {
                try {
                    await deleteImage(`/clients/${id}/picture`);
                    updated.hasPicture = false;
                    updated.pictureUrl = null;
                } catch (deleteErr) {
                    console.error("Error deleting picture:", deleteErr);
                    showToast({
                        title: "Klient aktualizován, ale obrázek se nesmazal",
                        description: "Zkuste to prosím znovu",
                        color: "warning",
                    });
                }
            } else if (picture && picture instanceof File) {
                try {
                    await uploadFile(`/clients/${id}/picture`, picture);
                    updated.hasPicture = true;
                } catch (uploadErr) {
                    console.error("Error uploading picture:", uploadErr);
                    showToast({
                        title: "Klient aktualizován, ale obrázek se nenahrál",
                        description: "Zkuste to prosím znovu",
                        color: "warning",
                    });
                }
            }

            if (updated.hasPicture) {
                try {
                    const imageUrl = await fetchImage(`/clients/${id}/picture`);
                    updated.pictureUrl = imageUrl;
                } catch (imgErr) {
                    console.error("Error fetching updated client picture:", imgErr);
                    updated.pictureUrl = null;
                }
            }

            fetchClients(filtersRef.current, { silent: true });

            showToast({
                title: "Klient úspěšně aktualizován",
                color: "success",
                icon: <UserRoundCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error updating client:", err);
            showErrorToast(err, "Chyba při aktualizaci klienta", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const terminateClient = async (id, data) => {
        try {
            const updated = await putJSON(`/clients/${id}/terminate`, data);

            fetchClients(filtersRef.current, { silent: true });

            showToast({
                title: "Klient úspěšně deaktivován",
                color: "success",
                icon: <UserRoundCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error terminating client:", err);
            showErrorToast(err, "Chyba při deaktivaci klienta", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const createClientAccount = async (clientId, email) => {
        try {
            const result = await postJSON(`/clients/${clientId}/account/create?email=${encodeURIComponent(email)}`);

            fetchClients(filtersRef.current, { silent: true });

            showToast({
                title: result.message,
                color: result.success ? "success" : "danger",
                icon: result.success ? <MailCheck /> : <MailX />
            });
        } catch (err) {
            console.error("Error creating client account:", err);
            showErrorToast(err, "Chyba při vytváření účtu", { icon: <MailX /> });
            throw err;
        }
    };

    const deactivateClientAccount = async (clientId) => {
        try {
            await putJSON(`/clients/${clientId}/account/deactivate`);

            fetchClients(filtersRef.current, { silent: true });

            showToast({
                title: "Účet klienta byl deaktivován",
                color: "success",
                icon: <UserRoundCheck />
            });
        } catch (err) {
            console.error("Error deactivating client account:", err);
            showErrorToast(err, "Chyba při deaktivaci účtu", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const activateClientAccount = async (clientId) => {
        try {
            await putJSON(`/clients/${clientId}/account/activate`);

            fetchClients(filtersRef.current, { silent: true });

            showToast({
                title: "Účet klienta byl aktivován",
                color: "success",
                icon: <UserRoundCheck />
            });
        } catch (err) {
            console.error("Error activating client account:", err);
            showErrorToast(err, "Chyba při aktivaci účtu", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const activateClient = async (id) => {
        try {
            const updated = await putJSON(`/clients/${id}/activate`);

            fetchClients(filtersRef.current, { silent: true });

            showToast({
                title: "Klient úspěšně aktivován",
                color: "success",
                icon: <UserRoundCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error activating client:", err);
            showErrorToast(err, "Chyba při aktivaci klienta", { icon: <UserRoundX /> });
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
        activateClientAccount
    };
}
