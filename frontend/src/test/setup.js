import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
    cleanup();
    server.resetHandlers();
    localStorage.clear();
    sessionStorage.clear();
});

afterAll(() => server.close());
