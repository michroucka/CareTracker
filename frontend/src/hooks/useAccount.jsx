import React from "react";
import { deleteImage, getJSON, postJSON, putJSON, uploadFile } from "../api/api.js";
import { DELETE_PICTURE } from "@/lib/pictures";
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

    /** Uploads a new own profile photo (a File) or removes it (DELETE_PICTURE); employees only. */
    const changeOwnPicture = async (picture) => {
        try {
            if (picture === DELETE_PICTURE) {
                await deleteImage("/user/me/picture");
                toast.success("Fotka odebrána");
            } else {
                await uploadFile("/user/me/picture", picture);
                toast.success("Fotka uložena");
            }
        } catch (err) {
            console.error("Error saving own picture:", err);
            showErrorToast(err, "Fotku se nepodařilo uložit");
            throw err;
        }
    };

    return {
        fetchAccountDetails,
        changeOwnPicture,
        updateAccountDetails,
        requestResetPasswordEmail,
        isSendingReset,
    };
}
