import { useState } from "react";
import { getJSON, postJSON, putJSON, uploadFile, fetchImage, deleteImage } from "../api/api.js";
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
            organization: client.organization,
            department: client.department,
            caregiver: client.caregiver,
            active: client.active,
            tasks: client.tasks || [],
        };
    }

    function mapClients(clients) {
        return clients.map((client) => mapClient(client));
    }

    const fetchClients = async (organizationId = null) => {
        try {
            setLoading(true);
            const url = organizationId
                ? `/clients?organizationId=${organizationId}`
                : '/clients';
            const clients = await getJSON(url);

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

            // Pokud má klient obrázek, načti ho
            if (client.hasPicture) {
                try {
                    const imageUrl = await fetchImage(`/clients/${id}/picture`);
                    client.pictureUrl = imageUrl;
                } catch (imgErr) {
                    console.error("Error fetching client picture:", imgErr);
                    // Klient se načetl, jen se nepodařilo načíst obrázek
                    client.pictureUrl = null;
                }
            }

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
            // Oddělení picture od ostatních dat
            const { picture, ...clientDataWithoutPicture } = clientData;

            // Vytvoření klienta
            const newClient = await postJSON("/clients", clientDataWithoutPicture);

            // Pokud je obrázek vybrán, nahraj ho
            if (picture && picture instanceof File) {
                try {
                    await uploadFile(`/clients/${newClient.id}/picture`, picture);
                } catch (uploadErr) {
                    console.error("Error uploading picture:", uploadErr);
                    // Klient je vytvořen, ale obrázek se nenahrál - zobrazíme upozornění
                    showToast({
                        title: "Klient vytvořen, ale obrázek se nenahrál",
                        description: "Můžete ho nahrát později při editaci",
                        color: "warning",
                    });
                }
            }

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
            // Oddělení picture od ostatních dat
            const { picture, ...updatedDataWithoutPicture } = updatedData;

            // Aktualizace klienta
            const updated = await putJSON(`/clients/${id}`, updatedDataWithoutPicture);

            // Pokud má být obrázek smazán (special "DELETE" marker)
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
            }
            // Pokud je obrázek vybrán a je to nový soubor, nahraj ho
            else if (picture && picture instanceof File) {
                try {
                    await uploadFile(`/clients/${id}/picture`, picture);
                    updated.hasPicture = true; // Mark that client now has picture
                } catch (uploadErr) {
                    console.error("Error uploading picture:", uploadErr);
                    // Klient je aktualizován, ale obrázek se nenahrál - zobrazíme upozornění
                    showToast({
                        title: "Klient aktualizován, ale obrázek se nenahrál",
                        description: "Zkuste to prosím znovu",
                        color: "warning",
                    });
                }
            }

            // Pokud má klient obrázek, načti ho pro zobrazení
            if (updated.hasPicture) {
                try {
                    const imageUrl = await fetchImage(`/clients/${id}/picture`);
                    updated.pictureUrl = imageUrl;
                } catch (imgErr) {
                    console.error("Error fetching updated client picture:", imgErr);
                    updated.pictureUrl = null;
                }
            }

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
        setClients,
        loading,
        fetchClients,
        fetchClient,
        createClient,
        updateClient,
        terminateClient,
        activateClient
    };
}


