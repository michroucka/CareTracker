const API_URL = import.meta.env.VITE_API_URL;

/**
 * Dispatches an "auth:unauthorized" custom event when the response status is 401,
 * triggering the global logout flow in AuthContext.
 * @param {Response} response
 */
function handleUnauthorized(response) {
    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
}

/**
 * Sends a GET request with credentials (session cookie) and returns the raw Response.
 * Does not throw on non-2xx — callers must check response.ok themselves.
 * @param {string} endpoint
 * @returns {Promise<Response>}
 */
export async function get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        credentials: "include",
    });
    return response;
}

/**
 * Sends a POST request with form-encoded body (application/x-www-form-urlencoded).
 * Used exclusively for Spring Security form login and logout endpoints.
 * @param {string} endpoint
 * @param {Object} data key-value pairs to encode
 * @returns {Promise<Response>}
 */
export async function post(endpoint, data) {
    const formData = new URLSearchParams();
    Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
    });

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        credentials: "include",
    });
    return response;
}

/**
 * Sends a GET request and parses the JSON response.
 * Throws an Error with the server's message field on non-2xx responses.
 * Dispatches "auth:unauthorized" on 401.
 * @param {string} endpoint
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
export async function getJSON(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: options.signal,
    });

    handleUnauthorized(response);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

    return response.json();
}

/**
 * Sends a POST request with a JSON body and parses the response.
 * Throws an Error with the server's message field on non-2xx responses.
 * @param {string} endpoint
 * @param {any} data will be serialized to JSON
 * @returns {Promise<any>}
 */
export async function postJSON(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
    });

    handleUnauthorized(response);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

    return response.json();
}

/**
 * Sends a PUT request with a JSON body and parses the response.
 * Returns null for 204 No Content responses.
 * Throws an Error with the server's message field on non-2xx responses.
 * @param {string} endpoint
 * @param {any} data will be serialized to JSON
 * @returns {Promise<any|null>}
 */
export async function putJSON(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
    });

    handleUnauthorized(response);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

    if (response.status === 204) return null;
    return response.json();
}

/**
 * Sends a DELETE request and returns the raw Response.
 * Throws an Error with the server's message field on non-2xx responses.
 * @param {string} endpoint
 * @returns {Promise<Response>}
 */
export async function deleteJSON(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
    });

    handleUnauthorized(response);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

    return response;
}

/**
 * Uploads a file using multipart/form-data POST and parses the JSON response.
 * The file is sent under the "file" field name, matching the backend @RequestParam("file").
 * @param {string} endpoint
 * @param {File} file
 * @returns {Promise<any>}
 */
export async function uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

    return response.json();
}

/**
 * Fetches a binary image and returns a blob object URL suitable for use in an <img> src.
 * The caller is responsible for calling URL.revokeObjectURL() when the URL is no longer needed.
 * @param {string} endpoint
 * @returns {Promise<string>} blob object URL
 */
export async function fetchImage(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

/**
 * Sends a DELETE request for an image resource and returns the raw Response.
 * @param {string} endpoint
 * @returns {Promise<Response>}
 */
export async function deleteImage(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

    return response;
}