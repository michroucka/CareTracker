import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Account from './Account';
import { renderWithProviders } from '@/test/render';
import { serveAndRecord, serverError } from '@/test/hooks';
import { caregiver, client } from '@/test/users';

// jsdom cannot decode or draw images; the shrinking itself is covered in pictures.test.js
vi.mock('@/lib/pictures', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, shrinkPhoto: vi.fn(async (file) => file) };
});

const accountDetails = {
    fullName: 'Jana Testová',
    username: 'jana',
    email: 'jana@caretracker.test',
    role: 'CAREGIVER',
};

function serveAccount(details = accountDetails) {
    return serveAndRecord('get', '/user/me', () => HttpResponse.json(details));
}

const credentialsCard = () => screen.getByText('Přihlašovací údaje').closest('[data-slot="card"]');

async function renderAccount(authStatus = caregiver()) {
    const rendered = renderWithProviders(<Account />, { authStatus, route: '/account' });
    await screen.findByText('Přihlašovací údaje');
    return rendered;
}

describe('Account', () => {
    beforeAll(() => {
        URL.createObjectURL = () => 'blob:photo';
        URL.revokeObjectURL = () => {};
    });

    // after the shared cleanup has unmounted the photo preview, which revokes its object URL
    afterAll(() => {
        delete URL.createObjectURL;
        delete URL.revokeObjectURL;
    });

    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    it('shows the name, role, username and e-mail', async () => {
        serveAccount();
        await renderAccount();

        expect(screen.getByRole('heading', { name: 'Můj účet' })).toBeInTheDocument();
        expect(screen.getByText('Jana Testová')).toBeInTheDocument();
        expect(screen.getByText('Pečovatel')).toBeInTheDocument();
        const card = within(credentialsCard());
        expect(card.getByText('jana')).toBeInTheDocument();
        expect(card.getByText('jana@caretracker.test')).toBeInTheDocument();
        expect(screen.getByText(/Odkaz přijde na jana@caretracker.test/)).toBeInTheDocument();
    });

    it('falls back to the username when the account has no name', async () => {
        serveAccount({ ...accountDetails, fullName: null });
        await renderAccount();

        expect(screen.getAllByText('jana')).toHaveLength(2);
    });

    it('tells the user when the details cannot be loaded', async () => {
        serveAndRecord('get', '/user/me', serverError('Databáze neodpovídá'));
        renderWithProviders(<Account />, { authStatus: caregiver(), route: '/account' });

        expect(await screen.findByText('Chyba načítání údajů')).toBeInTheDocument();
        expect(screen.getByText('Databáze neodpovídá')).toBeInTheDocument();
        expect(screen.getByLabelText('Načítání údajů')).toBeInTheDocument();
    });

    describe('credentials', () => {
        it('saves a new username and e-mail and refreshes the logged-in user', async () => {
            serveAccount();
            const updates = serveAndRecord('put', '/user/me', ({ request }) => request.json().then((body) => HttpResponse.json({ ...accountDetails, ...body })));
            const { user } = await renderAccount();
            const authChecks = serveAndRecord('get', '/auth-status', () => HttpResponse.json(caregiver({ username: 'jana.nova' })));

            await user.click(screen.getByRole('button', { name: /Upravit/ }));
            const username = await screen.findByLabelText(/Uživatelské jméno/);
            expect(username).toHaveValue('jana');
            expect(screen.getByLabelText(/E-mail/)).toHaveValue('jana@caretracker.test');
            await user.clear(username);
            await user.type(username, ' jana.nova ');
            await user.clear(screen.getByLabelText(/E-mail/));
            await user.type(screen.getByLabelText(/E-mail/), 'nova@caretracker.test');
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Údaje jsou uložené')).toBeInTheDocument();
            expect(updates[0].body).toEqual({ username: 'jana.nova', email: 'nova@caretracker.test' });
            await waitFor(() => expect(within(credentialsCard()).getByText('nova@caretracker.test')).toBeInTheDocument());
            expect(within(credentialsCard()).getByText('jana.nova')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Uložit změny' })).not.toBeInTheDocument();
            await waitFor(() => expect(authChecks).toHaveLength(1));
        });

        it.each([
            ['an empty username', { username: '' }, /Uživatelské jméno/, 'Prosím zadejte uživatelské jméno'],
            ['a username shorter than 4 characters', { username: 'jan' }, /Uživatelské jméno/, 'Uživatelské jméno musí mít alespoň 4 znaky'],
            ['an empty e-mail', { email: '' }, /E-mail/, 'Prosím zadejte e-mail'],
        ])('rejects %s without saving', async (_, values, field, message) => {
            serveAccount();
            const updates = serveAndRecord('put', '/user/me');
            const { user } = await renderAccount();

            await user.click(screen.getByRole('button', { name: /Upravit/ }));
            for (const [name, value] of Object.entries(values)) {
                const input = await screen.findByLabelText(name === 'username' ? /Uživatelské jméno/ : /E-mail/);
                await user.clear(input);
                if (value) await user.type(input, value);
            }
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            await waitFor(() => expect(screen.getByLabelText(field)).toHaveAccessibleDescription(message));
            expect(updates).toHaveLength(0);
        });

        it('keeps the form open with the server error', async () => {
            serveAccount();
            serveAndRecord('put', '/user/me', serverError('Uživatelské jméno je již obsazené', 409));
            const { user } = await renderAccount();

            await user.click(screen.getByRole('button', { name: /Upravit/ }));
            const username = await screen.findByLabelText(/Uživatelské jméno/);
            await user.clear(username);
            await user.type(username, 'obsazene');
            await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

            expect(await screen.findByText('Chyba při aktualizaci údajů')).toBeInTheDocument();
            expect(screen.getByText('Uživatelské jméno je již obsazené')).toBeInTheDocument();
            expect(screen.getByLabelText(/Uživatelské jméno/)).toHaveValue('obsazene');
            expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeEnabled();
        });

        it('throws away the changes on cancel', async () => {
            serveAccount();
            const updates = serveAndRecord('put', '/user/me');
            const { user } = await renderAccount();

            await user.click(screen.getByRole('button', { name: /Upravit/ }));
            await user.type(await screen.findByLabelText(/Uživatelské jméno/), '-zmena');
            await user.click(screen.getByRole('button', { name: 'Zrušit' }));
            await user.click(await screen.findByRole('button', { name: /Upravit/ }));

            expect(await screen.findByLabelText(/Uživatelské jméno/)).toHaveValue('jana');
            expect(updates).toHaveLength(0);
        });
    });

    describe('password', () => {
        it('sends the password reset e-mail', async () => {
            serveAccount();
            const requests = serveAndRecord('post', '/user/forgot-password', () => HttpResponse.json({ success: true, message: 'Email pro reset hesla byl odeslán' }));
            const { user } = await renderAccount();

            await user.click(screen.getByRole('button', { name: 'Poslat odkaz pro změnu hesla' }));

            expect(await screen.findByText('Email pro reset hesla byl odeslán')).toBeInTheDocument();
            expect(requests).toHaveLength(1);
            expect(screen.getByRole('button', { name: 'Poslat odkaz pro změnu hesla' })).toBeEnabled();
        });

        it('shows why the e-mail was not sent', async () => {
            serveAccount();
            serveAndRecord('post', '/user/forgot-password', serverError('E-mail se nepodařilo odeslat'));
            const { user } = await renderAccount();

            await user.click(screen.getByRole('button', { name: 'Poslat odkaz pro změnu hesla' }));

            expect(await screen.findByText('Chyba při odesílání e-mailu')).toBeInTheDocument();
            expect(screen.getByText('E-mail se nepodařilo odeslat')).toBeInTheDocument();
        });
    });

    describe('own photo', () => {
        it('uploads a new photo and refreshes the logged-in user', async () => {
            serveAccount();
            const uploads = serveAndRecord('post', '/user/me/picture', () => HttpResponse.json({ id: 5 }));
            const { user } = await renderAccount();
            const authChecks = serveAndRecord('get', '/auth-status', () => HttpResponse.json(caregiver({ pictureId: 5 })));

            await user.upload(document.getElementById('account-picture'), new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' }));

            expect(await screen.findByText('Fotka uložena')).toBeInTheDocument();
            expect(uploads).toHaveLength(1);
            await waitFor(() => expect(authChecks).toHaveLength(1));
            expect(await screen.findByRole('button', { name: /Změnit fotografii/ })).toBeEnabled();
        });

        it('removes the saved photo', async () => {
            serveAccount();
            const deletions = serveAndRecord('delete', '/user/me/picture', () => new HttpResponse(null, { status: 204 }));
            const { user } = await renderAccount(caregiver({ pictureId: 3 }));

            await user.click(await screen.findByRole('button', { name: /Odebrat/ }));

            expect(await screen.findByText('Fotka odebrána')).toBeInTheDocument();
            expect(deletions).toHaveLength(1);
        });

        it('puts the saved photo back when the upload fails', async () => {
            serveAccount();
            serveAndRecord('post', '/user/me/picture', serverError('Soubor je příliš velký', 413));
            const { user } = await renderAccount(caregiver({ pictureId: 3 }));

            await user.upload(document.getElementById('account-picture'), new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' }));

            expect(await screen.findByText('Fotku se nepodařilo uložit')).toBeInTheDocument();
            expect(screen.getByText('Soubor je příliš velký')).toBeInTheDocument();
            await waitFor(() => expect(screen.getByRole('button', { name: /Změnit fotografii/ })).toBeEnabled());
            expect(document.querySelector('img')).toHaveAttribute('src', expect.stringContaining('/employees/10/picture?size=full&v=3'));
        });

        it('is not offered to a client', async () => {
            serveAccount({ fullName: 'Karel Klient', username: 'karel', email: 'karel@example.com', role: 'CLIENT' });
            await renderAccount(client());

            expect(screen.getByText('Karel Klient')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /fotografii/ })).not.toBeInTheDocument();
        });
    });
});
