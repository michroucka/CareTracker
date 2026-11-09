import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { toast } from 'sonner';
import { server } from './server';

// jsdom lacks these browser APIs; Radix (shadcn) components and useMediaQuery call them.
if (typeof window !== 'undefined') {
    window.matchMedia ??= (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });

    window.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    Element.prototype.scrollIntoView ??= () => {};
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.releasePointerCapture ??= () => {};
}

/**
 * Node 22's fetch takes jsdom's FormData for its own and then waits forever on the jsdom File inside it.
 * MSW cannot read a multipart body in tests anyway, so uploads are sent as the field names and file names.
 */
function withoutJsdomFormData(init) {
    if (!(init.body instanceof FormData)) return init;
    const fields = [...init.body.entries()].map(([name, value]) => [name, typeof value === 'string' ? value : value.name]);
    return { ...init, body: new URLSearchParams(fields).toString() };
}

/**
 * Node's fetch rejects jsdom's AbortSignal ("Expected signal to be an instance of AbortSignal"),
 * so every request a data hook sends with a signal would fail. The signal is handled here instead
 * and the request goes on without it.
 */
function fetchForJsdom(nodeFetch) {
    return (input, { signal, ...init } = {}) => {
        const request = withoutJsdomFormData(init);
        if (!signal) return nodeFetch(input, request);
        if (signal.aborted) return Promise.reject(signal.reason);
        return new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
            nodeFetch(input, request).then(resolve, reject);
        });
    };
}

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    globalThis.fetch = fetchForJsdom(globalThis.fetch);
});

afterEach(() => {
    cleanup();
    // sonner keeps toasts in a global store, so a toast would otherwise satisfy findByText in the next test
    toast.dismiss();
    window.history.replaceState(null, '', '/');
    server.resetHandlers();
    localStorage.clear();
    sessionStorage.clear();
});

afterAll(() => server.close());
