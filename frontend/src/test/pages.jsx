import App from '@/app/App';
import { renderWithProviders } from './render';

/**
 * Renders the whole app (routes, route guards, shell) at `route`, so a test also covers how the page is wired
 * in App.tsx: redirects to the login, back to the remembered page, PublicOnlyRoute and so on.
 */
export function renderApp({ authStatus, route }) {
    // App resets the scroll position on navigation; jsdom has no layout, so scrolling is a no-op here.
    // Each test file runs in its own environment, so the stubs do not leak into other files.
    Element.prototype.scrollTo ??= () => {};
    window.scrollTo = () => {};
    return renderWithProviders(<App />, { authStatus, route });
}

/**
 * waitFor options for a page App loads lazily (React.lazy): the first import of its chunk can take seconds
 * while the whole suite runs in parallel, longer than the default findBy* timeout.
 */
export const lazyPageLoad = { timeout: 5000 };
