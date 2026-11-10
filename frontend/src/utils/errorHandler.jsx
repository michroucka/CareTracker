import { toast } from "@/components/ui/sonner";

/**
 * Displays an error toast with the message from the error object.
 * @param {Error} error
 * @param {string} [defaultTitle="Chyba"] toast title
 */
export function showErrorToast(error, defaultTitle = "Chyba") {
    toast.error(defaultTitle, { description: error?.message || "Nastala neočekávaná chyba" });
}

/**
 * For a fire-and-forget action (a menu item) whose hook has already shown the error toast and rethrown
 * the error for callers that need it; without a catch the promise would end as an unhandled rejection.
 */
export function errorAlreadyShown() {}
