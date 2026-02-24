import {getJSON, putJSON} from "../api/api.js";
import {showErrorToast} from "../utils/errorHandler.jsx";
import {UserRoundCheck, UserRoundX} from "lucide-react";
import {showToast} from "../components/MyToast.jsx";


export function useAccount() {
    const fetchAccountDetails = async () => {
        try {
            return await getJSON("/user/me");
        } catch (err) {
            console.error("Error fetching account details:", err);
            showErrorToast(err, "Chyba načítání údajů", { icon: <UserRoundX /> })
            throw err;
        }
    };

    const updateAccountDetails = async (updatedData) => {
        try {
            const updated = await putJSON("/user/me", updatedData);

            showToast({
                title: "Údaje úspěšně aktualizovány",
                color: "success",
                icon: <UserRoundCheck />
            });

            return updated;
        } catch (err) {
            console.error("Error updating account details: ", err);
            showErrorToast(err, "Chyba při aktualizaci údajů", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const resetPassword = async (data) => {
        try {
            const response = await putJSON("/user/reset-password", data);

            if (response.success) {
                showToast({
                    title: response.message,
                    color: "success",
                    icon: <UserRoundCheck />
                })
            } else {
                showErrorToast({
                    error: response.message,
                    options: { icon: <UserRoundX /> }
                })
            }
        } catch (err) {
            console.error("Error resetting password:", err);
            showErrorToast(err, "Chyba při změně hesla", { icon: <UserRoundX /> });
            throw err;
        }
    };

    return {
        fetchAccountDetails,
        updateAccountDetails,
        resetPassword
    }
}