import { screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serveAndRecord, serverError } from '@/test/hooks';
import { renderApp } from '@/test/pages';
import { caregiver } from '@/test/users';

const TOKEN = 'reset-token';

const tokenValid = () => HttpResponse.json({ success: true, message: 'Token je validní' });
const tokenInvalid = () => HttpResponse.json({ success: false, message: 'Token je neplatný nebo vypršel' }, { status: 400 });

const NEW_PASSWORD = /^Nové heslo\s*\*?$/;
const PASSWORD_CONFIRM = /Nové heslo znovu/;

function serveTokenValidation(respond = tokenValid) {
    return serveAndRecord('get', '/activation/validate-reset', respond);
}

async function openValidLink(authStatus) {
    serveTokenValidation();
    const rendered = renderApp({ authStatus, route: `/reset-password?token=${TOKEN}` });
    await screen.findByRole('heading', { name: 'Nové heslo' });
    return rendered;
}

async function fillForm(user, { password = 'noveheslo', passwordConfirm = password } = {}) {
    if (password) await user.type(screen.getByLabelText(NEW_PASSWORD), password);
    if (passwordConfirm) await user.type(screen.getByLabelText(PASSWORD_CONFIRM), passwordConfirm);
}

/** The hint under a field fades out before the error replaces it, so the description changes after a moment. */
const expectFieldError = (field, message) => waitFor(() => expect(screen.getByLabelText(field)).toHaveAccessibleDescription(message));

const submit = (user) => user.click(screen.getByRole('button', { name: 'Uložit nové heslo' }));

describe('ResetPassword', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    it('validates the token from the link and shows the form', async () => {
        const requests = serveTokenValidation();
        renderApp({ route: `/reset-password?token=${TOKEN}` });

        expect(await screen.findByRole('heading', { name: 'Nové heslo' })).toBeInTheDocument();
        expect(requests[0].searchParams.get('token')).toBe(TOKEN);
    });

    it.each([
        ['an invalid or expired token', tokenInvalid],
        ['a failed validation request', () => HttpResponse.error()],
    ])('explains that the link no longer works for %s', async (_, respond) => {
        serveTokenValidation(respond);
        renderApp({ route: `/reset-password?token=${TOKEN}` });

        expect(await screen.findByRole('heading', { name: 'Odkaz už neplatí' })).toBeInTheDocument();
        expect(screen.getByText(/Nový si můžete vyžádat na přihlašovací stránce/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Přejít na přihlášení' })).toHaveAttribute('href', '/login');
    });

    it('does not ask the server about a link without a token', async () => {
        const requests = serveTokenValidation();
        renderApp({ route: '/reset-password' });

        expect(await screen.findByRole('heading', { name: 'Odkaz už neplatí' })).toBeInTheDocument();
        expect(requests).toHaveLength(0);
    });

    it.each([
        ['an empty password', { password: '' }, NEW_PASSWORD, 'Prosím zadejte heslo'],
        ['a password shorter than 6 characters', { password: '12345' }, NEW_PASSWORD, 'Heslo musí mít alespoň 6 znaků'],
        ['a confirmation that does not match', { password: 'noveheslo', passwordConfirm: 'noveheslx' }, PASSWORD_CONFIRM, 'Hesla se neshodují'],
    ])('rejects %s', async (_, values, field, message) => {
        const resets = serveAndRecord('put', '/activation/reset-password');
        const { user } = await openValidLink();

        await fillForm(user, values);
        await submit(user);

        await expectFieldError(field, message);
        expect(resets).toHaveLength(0);
    });

    it('saves the new password and sends the user to the login', async () => {
        const resets = serveAndRecord('put', '/activation/reset-password', () => HttpResponse.json({ success: true, message: 'Heslo bylo změněno' }));
        const logouts = serveAndRecord('post', '/logout');
        const { user } = await openValidLink();

        await fillForm(user, { password: ' noveheslo ' });
        await submit(user);

        expect(await screen.findByRole('heading', { name: 'Přihlášení' })).toBeInTheDocument();
        expect(window.location.pathname).toBe('/login');
        expect(screen.getByText('Heslo je změněné')).toBeInTheDocument();
        expect(resets[0].body).toEqual({ token: TOKEN, password: 'noveheslo' });
        expect(logouts).toHaveLength(1);
    });

    it('logs out a user who was signed in, so they log in with the new password', async () => {
        serveAndRecord('put', '/activation/reset-password', () => HttpResponse.json({ success: true }));
        const logouts = serveAndRecord('post', '/logout');
        const { user } = await openValidLink(caregiver());

        await fillForm(user);
        await submit(user);

        expect(await screen.findByRole('heading', { name: 'Přihlášení' })).toBeInTheDocument();
        expect(logouts).toHaveLength(1);
    });

    it('shows the server error and keeps the form', async () => {
        serveAndRecord('put', '/activation/reset-password', serverError('Token je neplatný nebo vypršel', 400));
        const logouts = serveAndRecord('post', '/logout');
        const { user } = await openValidLink();

        await fillForm(user);
        await submit(user);

        expect(await screen.findByText('Token je neplatný nebo vypršel')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Nové heslo' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Uložit nové heslo' })).toBeEnabled();
        expect(logouts).toHaveLength(0);
    });
});
