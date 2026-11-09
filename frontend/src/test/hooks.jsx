import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import { afterEach } from 'vitest';
import { apiUrl, server } from './server';

afterEach(() => window.history.replaceState(null, '', '/'));

/**
 * renderHook inside a router that starts at `route` (e.g. '/performed-tasks?month=3&year=2026').
 *
 * BrowserRouter on the jsdom history rather than MemoryRouter: useSearchParamsUpdater reads
 * window.location.search, which MemoryRouter never updates, so under MemoryRouter every URL update
 * would drop the params from the initial route.
 */
export function renderHookWithRouter(hook, { route = '/', ...options } = {}) {
    window.history.replaceState(null, '', route);
    return renderHook(hook, { wrapper: BrowserRouter, ...options });
}

/** Search params of the current URL, as the router sees them. */
export const currentSearchParams = () => new URLSearchParams(window.location.search);

/**
 * Serves `method` + `path` (e.g. 'get', '/clients/:id') with `respond` and records every request
 * as `{ path, searchParams, body }`; `body` is the parsed JSON body, or the raw text when it is not JSON.
 */
export function serveAndRecord(method, path, respond = () => HttpResponse.json({})) {
    const requests = [];
    server.use(http[method](apiUrl(path), async (info) => {
        const url = new URL(info.request.url);
        const text = await info.request.clone().text();
        let body = text;
        try {
            body = text ? JSON.parse(text) : undefined;
        } catch {
            // multipart uploads are not JSON
        }
        requests.push({ path: url.pathname, searchParams: url.searchParams, body });
        return respond(info);
    }));
    return requests;
}

/** A server error with the `message` the backend sends, which the hooks show in the toast. */
export const serverError = (message, status = 500) => () => HttpResponse.json({ message }, { status });
