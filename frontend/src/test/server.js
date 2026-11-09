import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const API_URL = import.meta.env.VITE_API_URL;

export const apiUrl = (path) => `${API_URL}${path}`;

export const loggedOut = { isLoggedIn: false };

export function authStatusHandler(authStatus = loggedOut) {
    return http.get(apiUrl('/auth-status'), () => HttpResponse.json(authStatus));
}

export const server = setupServer(authStatusHandler());
