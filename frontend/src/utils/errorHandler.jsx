import { showToast } from "../components/MyToast.jsx";
import { CloudAlert } from "lucide-react";

/**
 * Zobrazí error toast s chybovou zprávou
 * @param {Error} error - Error objekt
 * @param {string} defaultTitle - Výchozí titulek pokud není specifikován
 * @param {Object} options - Další možnosti pro toast (icon, timeout, atd.)
 */
export function showErrorToast(error, defaultTitle = "Chyba", options = {}) {
    const message = error?.message || "Nastala neočekávaná chyba";

    showToast({
        title: defaultTitle,
        description: message,
        color: "danger",
        icon: options.icon || <CloudAlert />,
        timeout: options.timeout || 5000,
        ...options
    });
}

/**
 * Wrapper pro async funkce s automatickým error handlingem
 * @param {Function} asyncFn - Async funkce k zavolání
 * @param {string} errorTitle - Titulek error toastu
 * @param {Object} toastOptions - Možnosti pro toast
 * @returns {Promise} - Výsledek async funkce
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
