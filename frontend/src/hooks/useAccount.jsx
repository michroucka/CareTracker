import React from "react";
import { getJSON, postJSON, putJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { toast } from "@/components/ui/sonner";

export function useAccount() {
    const [isSendingReset, setSendingReset] = React.useState(false);

    const fetchAccountDetails = async () => {
        try {
            return await getJSON("/user/me");
        } catch (err) {
            console.error("Error fetching account details:", err);
            showErrorToast(err, "Chyba načítání údajů");
            throw err;
        }
    };

    const updateAccountDetails = async (updatedData) => {
        try {
            const updated = await putJSON("/user/me", updatedData);
            toast.success("Údaje jsou uložené");
            return updated;
        } catch (err) {
            console.error("Error updating account details: ", err);
            showErrorToast(err, "Chyba při aktualizaci údajů");
            throw err;
        }
    };

    const requestResetPasswordEmail = async () => {
        try {
            setSendingReset(true);
            const response = await postJSON("/user/forgot-password");
            if (response.success) {
                toast.success(response.message);
            } else {
                toast.error(response.message);
            }
        } catch (err) {
            console.error("Error resending password reset email:", err);
            showErrorToast(err, "Chyba při odesílání e-mailu");
            throw err;
        } finally {
            setSendingReset(false);
        }
    };

    return {
        fetchAccountDetails,
        updateAccountDetails,
        requestResetPasswordEmail,
        isSendingReset,
    };
}
