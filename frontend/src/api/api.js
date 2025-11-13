const API_URL = import.meta.env.VITE_API_URL;

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