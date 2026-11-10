import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStatusHandler, server } from '@/test/server';
import { serveAndRecord } from '@/test/hooks';
import { lazyPageLoad, renderApp } from '@/test/pages';
import { caregiver } from '@/test/users';

const loggedInCaregiver = caregiver({ username: 'jana' });


/** The login endpoint takes a form-encoded body (Spring Security form login). */
const formBody = (request) => new URLSearchParams(request.body);

/** After a successful login the session cookie makes /auth-status report the user. */
function serveLogin() {
    return serveAndRecord('post', '/login', () => {
        server.use(authStatusHandler(loggedInCaregiver));
        return HttpResponse.json({ success: true, message: 'Přihlášení proběhlo úspěšně', username: 'jana', role: 'CAREGIVER' });
    });
}

const serveFailedLogin = (respond) => serveAndRecord('post', '/login', respond);
const loginRefused = (message) => () => HttpResponse.json({ success: false, message }, { status: 401 });

function serveCaregiverHome() {
    serveAndRecord('get', '/dashboard', () => HttpResponse.json({ view: 'MINE', availableViews: ['MINE'], todayTasksCount: 0 }));
}

async function fillCredentials(user, { username = 'jana', password = 'heslo123' } = {}) {
    await user.type(await screen.findByLabelText('Uživatelské jméno'), username);
    await user.type(screen.getByLabelText('Heslo'), password);
}

describe('Login', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    it('logs in and opens the dashboard', async () => {
        const requests = serveLogin();
        serveCaregiverHome();
        const { user } = renderApp({ route: '/login' });

        await fillCredentials(user);
        await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

        expect(await screen.findByRole('link', { name: /Zapsat úkon/ }, lazyPageLoad)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/');
        expect(screen.getByText('Vítejte, jana!')).toBeInTheDocument();
        expect(Object.fromEntries(formBody(requests[0]))).toEqual({ username: 'jana', password: 'heslo123', 'remember-me': '' });
    });

    it('returns to the page the visitor wanted before logging in', async () => {
        serveLogin();
        serveAndRecord('get', '/user/me', () => HttpResponse.json({ fullName: 'Jana Testová', username: 'jana', email: 'jana@caretracker.test', role: 'CAREGIVER' }));
        const { user } = renderApp({ route: '/account' });

        expect(await screen.findByRole('heading', { name: 'Přihlášení' })).toBeInTheDocument();
        await fillCredentials(user);
        await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

        expect(await screen.findByRole('heading', { name: 'Můj účet' }, lazyPageLoad)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/account');
    });

    it('sends remember-me when the box is ticked', async () => {
        const requests = serveLogin();
        serveCaregiverHome();
        const { user } = renderApp({ route: '/login' });

        await fillCredentials(user);
        await user.click(screen.getByRole('checkbox', { name: 'Zapamatovat si mě' }));
        await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

        await screen.findByRole('link', { name: /Zapsat úkon/ }, lazyPageLoad);
        expect(formBody(requests[0]).get('remember-me')).toBe('on');
    });

    it('asks for both fields without contacting the server', async () => {
        const requests = serveLogin();
        const { user } = renderApp({ route: '/login' });

        await user.click(await screen.findByRole('button', { name: 'Přihlásit se' }));

        expect(screen.getByLabelText('Uživatelské jméno')).toHaveAccessibleDescription('Prosím zadejte uživatelské jméno');
        expect(screen.getByLabelText('Heslo')).toHaveAccessibleDescription('Prosím zadejte heslo');
        expect(requests).toHaveLength(0);
    });

    it.each([
        ['a wrong password', 'Neplatné přihlašovací údaje'],
        ['a blocked account', 'Váš účet byl zablokován'],
        ['a deactivated account', 'Váš účet byl deaktivován'],
    ])('explains %s and stays on the login page', async (_, message) => {
        serveFailedLogin(loginRefused(message));
        const { user } = renderApp({ route: '/login' });

        await fillCredentials(user, { password: 'spatne' });
        await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

        expect(await screen.findByLabelText('Heslo')).toHaveAccessibleDescription(message);
        expect(screen.getByLabelText('Uživatelské jméno')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getAllByText(message).length).toBeGreaterThan(1);
        expect(window.location.pathname).toBe('/login');
    });

    it('clears the error once the user starts typing again', async () => {
        serveFailedLogin(loginRefused('Neplatné přihlašovací údaje'));
        const { user } = renderApp({ route: '/login' });

        await fillCredentials(user);
        await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));
        await screen.findAllByText('Neplatné přihlašovací údaje');
        await user.type(screen.getByLabelText('Heslo'), 'x');

        expect(screen.getByLabelText('Heslo')).not.toHaveAttribute('aria-invalid');
    });

    it('lets the user try again when the server cannot be reached', async () => {
        serveFailedLogin(() => HttpResponse.error());
        const { user } = renderApp({ route: '/login' });

        await fillCredentials(user);
        await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

        await waitFor(() => expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeEnabled());
        expect(window.location.pathname).toBe('/login');
    });

    it('says in Czech that the server is unreachable', async () => {
        serveFailedLogin(() => HttpResponse.error());
        const { user } = renderApp({ route: '/login' });

        await fillCredentials(user);
        await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

        expect(await screen.findByText('Server není dostupný')).toBeInTheDocument();
    });

    it('sends a logged-in user away from the login page', async () => {
        serveCaregiverHome();
        renderApp({ authStatus: loggedInCaregiver, route: '/login' });

        expect(await screen.findByText('Nemůžete přistupovat na tuto stránku, když jste už přihlášeni')).toBeInTheDocument();
        expect(window.location.pathname).toBe('/');
    });

    describe('forgotten password', () => {
        const RESET_REQUESTED = 'Pokud účet s tímto e-mailem existuje, poslali jsme na něj odkaz pro nastavení nového hesla';

        it('sends the link and returns to the login form with the server message', async () => {
            const requests = serveAndRecord('post', '/activation/forgot-password', () => HttpResponse.json({ success: true, message: RESET_REQUESTED }));
            const { user } = renderApp({ route: '/login' });

            await user.click(await screen.findByRole('button', { name: 'Zapomenuté heslo?' }));
            expect(await screen.findByRole('heading', { name: 'Zapomenuté heslo' })).toBeInTheDocument();
            await user.type(screen.getByLabelText('E-mail'), 'neznamy@example.com');
            await user.click(screen.getByRole('button', { name: 'Poslat odkaz' }));

            expect(await screen.findByText(RESET_REQUESTED)).toBeInTheDocument();
            expect(await screen.findByRole('heading', { name: 'Přihlášení' })).toBeInTheDocument();
            expect(formBody(requests[0]).get('email')).toBe('neznamy@example.com');
        });

        it('asks for the e-mail before sending anything', async () => {
            const requests = serveAndRecord('post', '/activation/forgot-password');
            const { user } = renderApp({ route: '/login' });

            await user.click(await screen.findByRole('button', { name: 'Zapomenuté heslo?' }));
            await user.click(await screen.findByRole('button', { name: 'Poslat odkaz' }));

            expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Prosím zadejte e-mail');
            expect(requests).toHaveLength(0);
        });

        it('stays on the form when the server refuses', async () => {
            serveAndRecord('post', '/activation/forgot-password', () => HttpResponse.json({ success: false, message: 'Příliš mnoho požadavků' }));
            const { user } = renderApp({ route: '/login' });

            await user.click(await screen.findByRole('button', { name: 'Zapomenuté heslo?' }));
            await user.type(await screen.findByLabelText('E-mail'), 'jana@caretracker.test');
            await user.click(screen.getByRole('button', { name: 'Poslat odkaz' }));

            expect(await screen.findByText('Příliš mnoho požadavků')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'Zapomenuté heslo' })).toBeInTheDocument();
        });

        it('goes back to the login form', async () => {
            const { user } = renderApp({ route: '/login' });

            await user.click(await screen.findByRole('button', { name: 'Zapomenuté heslo?' }));
            await user.click(await screen.findByRole('button', { name: /Zpět na přihlášení/ }));

            const form = (await screen.findByRole('heading', { name: 'Přihlášení' })).closest('form');
            expect(within(form).getByRole('button', { name: 'Přihlásit se' })).toBeInTheDocument();
        });
    });
});
