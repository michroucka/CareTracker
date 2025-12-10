import { useState } from "react";
import { getJSON, postJSON, putJSON, deleteJSON } from "../api/api.js";
import { showToast } from "../components/MyToast.jsx";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert, UserRoundCheck, UserRoundX, UserRoundMinus } from "lucide-react";

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const clients = await getJSON("/clients");

            // Mapuj data z backendu DTO
            const mappedClients = clients.map(client => ({
                id: client.id,
                name: `${client.firstName} ${client.lastName}`,
                gender: client.gender,
                address: `${client.street}, ${client.city}`,
                department: client.department,
                caregiver: client.caregiver,
            }));

            setClients(mappedClients);
        } catch (err) {
            console.error("Error fetching clients:", err);
            showErrorToast(err, "Chyba při načítání klientů", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
        }
    };

    // Načtení jednoho klienta
    const fetchClient = async (id) => {
        try {
            setLoading(true);
            const client = await getJSON(`/clients/${id}`);
            return client;
        } catch (err) {
            console.error("Error fetching client:", err);
            showErrorToast(err, "Klient nenalezen", { icon: <UserRoundX /> });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Vytvoření klienta
    const createClient = async (clientData) => {
        try {
            const newClient = await postJSON("/clients", clientData);

            // Přidej do seznamu s mapováním
            const mappedClient = {
                id: newClient.id,
                name: `${newClient.firstName} ${newClient.lastName}`,
                gender: newClient.gender,
                address: `${newClient.street}, ${newClient.city}`,
                department: newClient.department,
                caregiver: newClient.caregiver,
            };

            setClients(prev => [...prev, mappedClient]);

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
            const mappedClient = {
                id: updated.id,
                name: `${updated.firstName} ${updated.lastName}`,
                gender: updated.gender,
                address: `${updated.street}, ${updated.city}`,
                department: updated.department,
                caregiver: updated.caregiver,
            };

            setClients(prev => prev.map(client =>
                client.id === id ? mappedClient : client
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

    // Smazání klienta
    const deleteClient = async (id) => {
        try {
            await deleteJSON(`/clients/${id}`);

            // Odeber ze seznamu
            setClients(prev => prev.filter(client => client.id !== id));

            showToast({
                title: "Klient úspěšně smazán",
                color: "success",
                icon: <UserRoundMinus />
            });
        } catch (err) {
            console.error("Error deleting client:", err);
            showErrorToast(err, "Chyba při mazání klienta", { icon: <CloudAlert /> });
            throw err;
        }
    };

    return {
        clients,
        loading,
        fetchClients,
        fetchClient,
        createClient,
        updateClient,
        deleteClient
    };
}


