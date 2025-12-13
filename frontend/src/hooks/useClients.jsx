import { useState } from "react";
import { getJSON, postJSON, putJSON } from "../api/api.js";
import { showToast } from "../components/MyToast.jsx";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert, UserRoundCheck, UserRoundX } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);

    function mapClient(client) {
        return {
            id: client.id,
            name: `${client.firstName} ${client.lastName}`,
            gender: client.gender,
            address: `${client.street}, ${client.city}`,
            department: client.department,
            caregiver: client.caregiver,
            active: client.active,
        };
    }

    function mapClients(clients) {
        return clients.map((client) => mapClient(client));
    }

    const fetchClients = async () => {
        try {
            setLoading(true);
            const clients = await getJSON("/clients");

            // Mapuj data z backendu DTO
            const mappedClients = mapClients(clients);

            const sorted = sortByKey(mappedClients, 'name', 'ascending');
            setClients(sorted);
        } catch (err) {
            console.error("Error fetching clients: ", err);
            showErrorToast(err, "Chyba při načítání klientů", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
        }
    };

    // Načtení jednoho klienta
    const fetchClient = async (id) => {
        try {
            const client = await getJSON(`/clients/${id}`);
            return client;
        } catch (err) {
            console.error("Error fetching client:", err);
            showErrorToast(err, "Klient nenalezen", { icon: <UserRoundX /> });
            throw err;
        }
    };

    // Vytvoření klienta
    const createClient = async (clientData) => {
        try {
            const newClient = await postJSON("/clients", clientData);

            // Přidej do seznamu s mapováním
            const mappedClient = mapClient(newClient);

            setClients(prev =>
                sortByKey([...prev, mappedClient], 'name', 'ascending')
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

    // Aktualizace klienta
    const updateClient = async (id, updatedData) => {
        try {
            const updated = await putJSON(`/clients/${id}`, updatedData);

            // Aktualizuj v seznamu s mapováním
            const mappedClient = mapClient(updated);

            setClients(prev => sortByKey(
                prev.map(client => client.id === id ? mappedClient : client),
                'name',
                'ascending'
            ));

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

    // Deaktivace klienta
    const terminateClient = async (id, data) => {
        try {
            const updated = await putJSON(`/clients/${id}/terminate`, data);

            // Aktualizuj v seznamu s mapováním
            const mappedClient = mapClient(updated);

            setClients(prev => sortByKey(
                prev.map(client => client.id === id ? mappedClient : client),
                'name',
                'ascending'
            ));

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

    const activateClient = async (id) => {
        try {
            const updated = await putJSON(`/clients/${id}/activate`);

            // Aktualizuj v seznamu s mapováním
            const mappedClient = mapClient(updated);

            setClients(prev => sortByKey(
                prev.map(client => client.id === id ? mappedClient : client),
                'name',
                'ascending'
            ));

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
        loading,
        fetchClients,
        fetchClient,
        createClient,
        updateClient,
        terminateClient,
        activateClient
    };
}


