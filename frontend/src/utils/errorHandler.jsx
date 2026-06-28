import { toast } from "@heroui/react";
import { CloudAlert } from "lucide-react";

export function showErrorToast(error, defaultTitle = "Chyba", options = {}) {
    const message = error?.message || "Nastala neočekávaná chyba";

    toast.danger(defaultTitle, {
        description: message,
        indicator: options.icon || <CloudAlert />,
        timeout: options.timeout || 5000,
    });
}

/**
 * Calls an async function and automatically shows an error toast on failure.
 * Re-throws the error so the caller can react if needed.
 * @param {Function} asyncFn the async function to call
 * @param {string} errorTitle title for the error toast
 * @param {Object} [toastOptions] additional toast options
 * @returns {Promise}
 */
export async function handleAsyncError(asyncFn, errorTitle, toastOptions = {}) {
    try {
        return await asyncFn();
    } catch (error) {
        console.error(errorTitle, error);
        showErrorToast(error, errorTitle, toastOptions);
        throw error;
    }
}
