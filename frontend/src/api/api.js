const API_URL = import.meta.env.VITE_API_URL;

function handleUnauthorized(response) {
    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
}

export async function get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        credentials: "include",
    });
    return response;
}

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