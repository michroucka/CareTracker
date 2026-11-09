import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { getJSON } from '@/api/api';
import { toast } from '@/components/ui/sonner';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { coordinator, superadmin } from '@/test/users';

const SUPERADMIN_ORG_KEY = 'superadmin_org';

function AuthProbe() {
    const { user, superadminOrg, setSuperadminOrg, logout, logoutSilent } = useAuth();
    const { pathname } = useLocation();

    return (
        <>
            <p data-testid="location">{pathname}</p>
            <p data-testid="user">{user ? `${user.fullName} (${user.role})` : 'nepřihlášen'}</p>
            <p data-testid="organization">{superadminOrg?.name ?? 'bez organizace'}</p>
            <button type="button" onClick={logout}>Odhlásit</button>
            <button type="button" onClick={logoutSilent}>Odhlásit potichu</button>
            <button type="button" onClick={() => setSuperadminOrg({ id: 3, name: 'Charita Plzeň' })}>Vybrat organizaci</button>
            <button type="button" onClick={() => setSuperadminOrg(null)}>Zrušit organizaci</button>
        </>
    );
}

const shownUser = () => screen.getByTestId('user');
const shownLocation = () => screen.getByTestId('location');
const shownOrganization = () => screen.getByTestId('organization');

async function renderAuth(authStatus, route = '/clients') {
    const result = renderWithProviders(<AuthProbe />, { authStatus, route });
    await screen.findByTestId('user');
    return result;
}

/** Answers POST /logout and keeps the requests, so tests can check what was sent. */
function serveLogout(response = () => new HttpResponse(null, { status: 200 })) {
    const requests = [];
    server.use(http.post(apiUrl('/logout'), async ({ request }) => {
        requests.push({ csrfToken: request.headers.get('X-XSRF-TOKEN'), contentType: request.headers.get('Content-Type') });
        return response();
    }));
    return requests;
}

function setCsrfCookie(token) {
    document.cookie = `XSRF-TOKEN=${token}; path=/`;
}

afterEach(() => {
    // sonner keeps toasts in a module-level store, so they would show up in the next test's Toaster
    toast.dismiss();
    document.cookie = 'XSRF-TOKEN=; path=/; max-age=0';
    vi.restoreAllMocks();
});

describe('AuthContext – loading the session', () => {
    it('is loading until auth-status answers, then exposes the user and role', async () => {
        server.use(http.get(apiUrl('/auth-status'), () => HttpResponse.json(coordinator())));
        let auth;
        function Capture() {
            auth = useAuth();
            return null;
        }
        render(<MemoryRouter><AuthProvider><Capture /></AuthProvider></MemoryRouter>);

        expect(auth.loading).toBe(true);
        expect(auth.user).toBeNull();

        await waitFor(() => expect(auth.loading).toBe(false));
        expect(auth.user).toEqual({
            username: 'coordinator@caretracker.test',
            role: 'COORDINATOR',
            fullName: 'Jana Testová',
            employeeId: 10,
            employeeRole: 'COORDINATOR',
            departmentId: 2,
            organizationId: 1,
            clientId: undefined,
            pictureId: null,
        });
    });

    it('has no user when the session is not logged in', async () => {
        await renderAuth({ isLoggedIn: false });

        expect(shownUser()).toHaveTextContent('nepřihlášen');
    });

    it('has no user when auth-status cannot be reached', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        server.use(http.get(apiUrl('/auth-status'), () => HttpResponse.error()));
        render(<MemoryRouter><AuthProvider><AuthProbe /></AuthProvider></MemoryRouter>);

        await waitFor(() => expect(console.error).toHaveBeenCalled());
        expect(shownUser()).toHaveTextContent('nepřihlášen');
    });

    it('restores the organization a superadmin selected before the reload', async () => {
        localStorage.setItem(SUPERADMIN_ORG_KEY, JSON.stringify({ id: 3, name: 'Charita Plzeň' }));

        await renderAuth(superadmin());

        expect(shownUser()).toHaveTextContent('Super Admin (SUPERADMIN)');
        expect(shownOrganization()).toHaveTextContent('Charita Plzeň');
    });

    it('drops a broken stored organization', async () => {
        localStorage.setItem(SUPERADMIN_ORG_KEY, '{nope');

        await renderAuth(superadmin());

        expect(shownOrganization()).toHaveTextContent('bez organizace');
        expect(localStorage.getItem(SUPERADMIN_ORG_KEY)).toBeNull();
    });

    it('ignores a stored organization for other roles', async () => {
        localStorage.setItem(SUPERADMIN_ORG_KEY, JSON.stringify({ id: 3, name: 'Charita Plzeň' }));

        await renderAuth(coordinator());

        expect(shownOrganization()).toHaveTextContent('bez organizace');
    });

    it('remembers the superadmin organization across reloads', async () => {
        const { user } = await renderAuth(superadmin());

        await user.click(screen.getByRole('button', { name: 'Vybrat organizaci' }));
        expect(shownOrganization()).toHaveTextContent('Charita Plzeň');
        expect(JSON.parse(localStorage.getItem(SUPERADMIN_ORG_KEY))).toEqual({ id: 3, name: 'Charita Plzeň' });

        await user.click(screen.getByRole('button', { name: 'Zrušit organizaci' }));
        expect(localStorage.getItem(SUPERADMIN_ORG_KEY)).toBeNull();
    });
});

describe('AuthContext – logout', () => {
    it('posts /logout with the CSRF token, clears the user and goes home', async () => {
        setCsrfCookie('token-123');
        const requests = serveLogout();
        localStorage.setItem(SUPERADMIN_ORG_KEY, JSON.stringify({ id: 3, name: 'Charita Plzeň' }));
        const { user } = await renderAuth(superadmin());

        await user.click(screen.getByRole('button', { name: 'Odhlásit' }));

        await waitFor(() => expect(shownUser()).toHaveTextContent('nepřihlášen'));
        expect(requests).toEqual([{ csrfToken: 'token-123', contentType: 'application/x-www-form-urlencoded' }]);
        expect(shownOrganization()).toHaveTextContent('bez organizace');
        expect(localStorage.getItem(SUPERADMIN_ORG_KEY)).toBeNull();
        expect(shownLocation()).toHaveTextContent(/^\/$/);
        expect(await screen.findByText('Odhlášení proběhlo')).toBeInTheDocument();
    });

    it('keeps the user signed in and says so when the server cannot be reached', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        serveLogout(() => HttpResponse.error());
        const { user } = await renderAuth(coordinator());

        await user.click(screen.getByRole('button', { name: 'Odhlásit' }));

        expect(await screen.findByText('Odhlášení se nepodařilo')).toBeInTheDocument();
        expect(shownUser()).toHaveTextContent('Jana Testová (COORDINATOR)');
        expect(shownLocation()).toHaveTextContent('/clients');
    });

    it('tells the user when the server refuses the logout', async () => {
        serveLogout(() => new HttpResponse(null, { status: 403 }));
        const { user } = await renderAuth(coordinator());

        await user.click(screen.getByRole('button', { name: 'Odhlásit' }));

        expect(await screen.findByText('Odhlášení se nepodařilo')).toBeInTheDocument();
    });

    it('signs out silently even when /logout fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        setCsrfCookie('token-456');
        const requests = serveLogout(() => HttpResponse.error());
        const { user } = await renderAuth(coordinator());

        await user.click(screen.getByRole('button', { name: 'Odhlásit potichu' }));

        await waitFor(() => expect(shownUser()).toHaveTextContent('nepřihlášen'));
        expect(requests).toEqual([{ csrfToken: 'token-456', contentType: 'application/x-www-form-urlencoded' }]);
    });
});

describe('AuthContext – expired session', () => {
    it('signs the user out and goes to login on auth:unauthorized', async () => {
        await renderAuth(coordinator());

        act(() => { window.dispatchEvent(new CustomEvent('auth:unauthorized')); });

        expect(shownUser()).toHaveTextContent('nepřihlášen');
        expect(shownLocation()).toHaveTextContent('/login');
    });

    it('signs out after an API call answers 401', async () => {
        server.use(http.get(apiUrl('/clients'), () => new HttpResponse(null, { status: 401 })));
        await renderAuth(coordinator());

        await act(() => getJSON('/clients').catch(() => {}));

        expect(shownUser()).toHaveTextContent('nepřihlášen');
        expect(shownLocation()).toHaveTextContent('/login');
    });

    it('stops listening after unmount', async () => {
        const { unmount } = await renderAuth(coordinator());
        const removeListener = vi.spyOn(window, 'removeEventListener');

        unmount();

        expect(removeListener).toHaveBeenCalledWith('auth:unauthorized', expect.any(Function));
    });

    it('forgets the stored superadmin organization', async () => {
        localStorage.setItem(SUPERADMIN_ORG_KEY, JSON.stringify({ id: 3, name: 'Charita Plzeň' }));
        await renderAuth(superadmin());

        act(() => { window.dispatchEvent(new CustomEvent('auth:unauthorized')); });

        expect(localStorage.getItem(SUPERADMIN_ORG_KEY)).toBeNull();
    });
});

describe('useAuth', () => {
    it('refuses to work outside AuthProvider', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        function Orphan() {
            useAuth();
            return null;
        }

        expect(() => render(<Orphan />)).toThrow('useAuth must be used within an AuthProvider');
    });
});
