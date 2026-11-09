import { screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serveAndRecord, serverError } from '@/test/hooks';
import { lazyPageLoad, renderApp } from '@/test/pages';
import { caregiver } from '@/test/users';

const TOKEN = 'activation-token';

const tokenValid = () => HttpResponse.json({ success: true, message: 'Token je validní' });
const tokenInvalid = () => HttpResponse.json({ success: false, message: 'Token je neplatný nebo vypršel' }, { status: 400 });

function serveTokenValidation(respond = tokenValid) {
    return serveAndRecord('get', '/activation/validate', respond);
}

async function openValidLink() {
    serveTokenValidation();
    const rendered = renderApp({ route: `/activate?token=${TOKEN}` });
    await screen.findByRole('heading', { name: 'Aktivace účtu' });
    return rendered;
}

async function fillForm(user, { username = 'jana.nova', password = 'tajne123', passwordConfirm = password } = {}) {
    if (username) await user.type(screen.getByLabelText(/Uživatelské jméno/), username);
    if (password) await user.type(screen.getByLabelText(/^Heslo\s*\*?$/), password);
    if (passwordConfirm) await user.type(screen.getByLabelText(/Heslo znovu/), passwordConfirm);
}

/** The hint under a field fades out before the error replaces it, so the description changes after a moment. */
const expectFieldError = (field, message) => waitFor(() => expect(screen.getByLabelText(field)).toHaveAccessibleDescription(message));

const submit = (user) => user.click(screen.getByRole('button', { name: 'Aktivovat účet' }));

describe('Activate', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    it('validates the token from the link and shows the form', async () => {
        const requests = serveTokenValidation();
        renderApp({ route: `/activate?token=${TOKEN}` });

        expect(await screen.findByRole('heading', { name: 'Aktivace účtu' })).toBeInTheDocument();
        expect(requests[0].searchParams.get('token')).toBe(TOKEN);
    });

    it.each([
        ['an invalid or expired token', tokenInvalid],
        ['a failed validation request', () => HttpResponse.error()],
    ])('explains that the link no longer works for %s', async (_, respond) => {
        serveTokenValidation(respond);
        renderApp({ route: `/activate?token=${TOKEN}` });

        expect(await screen.findByRole('heading', { name: 'Odkaz už neplatí' })).toBeInTheDocument();
        expect(screen.getByText(/Aktivační odkaz je neplatný nebo vypršel/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Přejít na přihlášení' })).toHaveAttribute('href', '/login');
        expect(screen.queryByRole('button', { name: 'Aktivovat účet' })).not.toBeInTheDocument();
    });

    it('does not ask the server about a link without a token', async () => {
        const requests = serveTokenValidation();
        renderApp({ route: '/activate' });

        expect(await screen.findByRole('heading', { name: 'Odkaz už neplatí' })).toBeInTheDocument();
        expect(requests).toHaveLength(0);
    });

    it('asks for all fields', async () => {
        const completions = serveAndRecord('post', '/activation/complete');
        const { user } = await openValidLink();

        await submit(user);

        await expectFieldError(/Uživatelské jméno/, 'Prosím zadejte uživatelské jméno');
        await expectFieldError(/^Heslo\s*\*?$/, 'Prosím zadejte heslo');
        expect(completions).toHaveLength(0);
    });

    it.each([
        ['a username shorter than 4 characters', { username: 'jan' }, /Uživatelské jméno/, 'Uživatelské jméno musí mít alespoň 4 znaky'],
        ['a password shorter than 6 characters', { password: '12345' }, /^Heslo\s*\*?$/, 'Heslo musí mít alespoň 6 znaků'],
        ['a confirmation that does not match', { password: 'tajne123', passwordConfirm: 'tajne124' }, /Heslo znovu/, 'Hesla se neshodují'],
    ])('rejects %s', async (_, values, field, message) => {
        const completions = serveAndRecord('post', '/activation/complete');
        const { user } = await openValidLink();

        await fillForm(user, values);
        await submit(user);

        await expectFieldError(field, message);
        expect(completions).toHaveLength(0);
    });

    it('accepts the minimum lengths', async () => {
        const completions = serveAndRecord('post', '/activation/complete', () => HttpResponse.json({ success: true }));
        const { user } = await openValidLink();

        await fillForm(user, { username: 'jana', password: '123456' });
        await submit(user);

        expect(await screen.findByRole('heading', { name: 'Přihlášení' })).toBeInTheDocument();
        expect(completions).toHaveLength(1);
    });

    it('activates the account with the trimmed values and sends the user to the login', async () => {
        const completions = serveAndRecord('post', '/activation/complete', () => HttpResponse.json({ success: true, message: 'Účet byl úspěšně aktivován' }));
        const { user } = await openValidLink();

        await fillForm(user, { username: '  jana.nova ', password: ' tajne123 ' });
        await submit(user);

        expect(await screen.findByRole('heading', { name: 'Přihlášení' })).toBeInTheDocument();
        expect(window.location.pathname).toBe('/login');
        expect(screen.getByText('Účet je aktivovaný')).toBeInTheDocument();
        expect(completions[0].body).toEqual({ token: TOKEN, username: 'jana.nova', password: 'tajne123' });
    });

    it('shows the server error and keeps the form', async () => {
        serveAndRecord('post', '/activation/complete', serverError('Uživatelské jméno je již obsazené', 409));
        const { user } = await openValidLink();

        await fillForm(user);
        await submit(user);

        expect(await screen.findByText('Uživatelské jméno je již obsazené')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Aktivace účtu' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Uživatelské jméno/)).toHaveValue('jana.nova');
        expect(screen.getByRole('button', { name: 'Aktivovat účet' })).toBeEnabled();
    });

    it('is not available to a logged-in user', async () => {
        serveAndRecord('get', '/dashboard', () => HttpResponse.json({ view: 'MINE', availableViews: ['MINE'] }));
        renderApp({ authStatus: caregiver(), route: `/activate?token=${TOKEN}` });

        expect(await screen.findByRole('link', { name: /Zapsat úkon/ }, lazyPageLoad)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/');
    });
});
