import React from "react";
import { get } from "../api/api.js";

/**
 * Validates a one-time token from an e-mail link (activation, password reset).
 * No toasts: the page itself explains an invalid link.
 *
 * @param {string} endpoint validation endpoint, the token is appended as `?token=`
 * @param {string|null} token token from the URL
 * @returns {{ isValidating: boolean, isValid: boolean }}
 */
export function useTokenValidation(endpoint, token) {
    // the answer is kept with the token it belongs to; a missing token is invalid without asking
    const [validated, setValidated] = React.useState({ token: null, isValid: false });

    React.useEffect(() => {
        if (!token) return;

        const validateToken = async () => {
            let isValid = false;
            try {
                const response = await get(`${endpoint}?token=${encodeURIComponent(token)}`);
                const result = await response.json();
                isValid = response.ok && result.success;
            } catch (error) {
                console.error("Token validation error:", error);
            }
            setValidated({ token, isValid });
        };

        validateToken();
    }, [endpoint, token]);

    if (!token) return { isValidating: false, isValid: false };
    return { isValidating: validated.token !== token, isValid: validated.token === token && validated.isValid };
}
