import { showToast } from "../components/MyToast.jsx";

/**
 * Displays an error toast with the message from the error object.
 * @param {Error} error
 * @param {string} [defaultTitle="Chyba"] toast title
 * @param {Object} [options] additional toast options (timeout)
 */
export function showErrorToast(error, defaultTitle = "Chyba", options = {}) {
    const message = error?.message || "Nastala neočekávaná chyba";

    showToast({
        title: defaultTitle,
        description: message,
        color: "danger",
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
