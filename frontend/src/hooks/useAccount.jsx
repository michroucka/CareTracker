import React from "react";
import {getJSON, postJSON, putJSON} from "../api/api.js";
import {showErrorToast} from "../utils/errorHandler.jsx";
import {MailCheck, MailX, UserRoundCheck, UserRoundX} from "lucide-react";
import { toast } from "@heroui/react";


export function useAccount() {
    const [isSendingReset, setSendingReset] = React.useState(false);

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

            toast.success("Údaje úspěšně aktualizovány", { indicator: <UserRoundCheck /> });

            return updated;
        } catch (err) {
            console.error("Error updating account details: ", err);
            showErrorToast(err, "Chyba při aktualizaci údajů", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const requestResetPasswordEmail = async () => {
        try {
            setSendingReset(true);
            const response = await postJSON(`/user/forgot-password`);

            if (response.success) {
                toast.success(response.message, { indicator: <MailCheck /> });
            } else {
                toast.danger(response.message, { indicator: <MailX /> });
            }
        } catch (err) {
            console.error("Error resending password reset email:", err);
            showErrorToast(err, "Chyba při odesílání emailu", { icon: <MailX /> });
            throw err;
        } finally {
            setSendingReset(false);
        }
    }

    const resetPassword = async (data) => {
        try {
            const response = await putJSON("/activation/reset-password", data);

            if (response.success) {
                toast.success(response.message, { indicator: <UserRoundCheck /> });
            } else {
                toast.danger(response.message, { indicator: <UserRoundX /> });
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
        requestResetPasswordEmail,
        isSendingReset
    }
}