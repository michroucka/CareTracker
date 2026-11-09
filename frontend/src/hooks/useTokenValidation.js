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
    const [isValidating, setIsValidating] = React.useState(true);
    const [isValid, setIsValid] = React.useState(false);

    React.useEffect(() => {
        if (!token) {
            setIsValid(false);
            setIsValidating(false);
            return;
        }

        const validateToken = async () => {
            try {
                const response = await get(`${endpoint}?token=${encodeURIComponent(token)}`);
                const result = await response.json();
                setIsValid(response.ok && result.success);
            } catch (error) {
                console.error("Token validation error:", error);
                setIsValid(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [endpoint, token]);

    return { isValidating, isValid };
}
