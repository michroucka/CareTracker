import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { renderWithProviders } from '@/test/render';
import { loggedOut } from '@/test/server';
import { admin, caregiver, client, coordinator } from '@/test/users';

function LoginPage() {
    const location = useLocation();
    return <h1>Přihlášení (návrat na {location.state?.from?.pathname})</h1>;
}

function renderSecretPage({ authStatus, allowedRoles }) {
    return renderWithProviders(
        <Routes>
            <Route path="/" element={<h1>Domů</h1>} />
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/secret"
                element={(
                    <ProtectedRoute allowedRoles={allowedRoles}>
                        <h1>Tajná stránka</h1>
                    </ProtectedRoute>
                )}
            />
        </Routes>,
        { authStatus, route: '/secret' },
    );
}

describe('ProtectedRoute', () => {
    let consoleWarn;

    beforeEach(() => {
        consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarn.mockRestore();
    });

    it('sends a logged out visitor to the login page and remembers where they wanted to go', async () => {
        renderSecretPage({ authStatus: loggedOut });

        expect(await screen.findByRole('heading', { name: 'Přihlášení (návrat na /secret)' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Tajná stránka' })).not.toBeInTheDocument();
        expect(await screen.findByText('Pro zobrazení této stránky se musíte přihlásit')).toBeInTheDocument();
    });

    it('sends a user with a disallowed role home with a warning', async () => {
        renderSecretPage({ authStatus: caregiver(), allowedRoles: ['ADMIN', 'COORDINATOR'] });

        expect(await screen.findByRole('heading', { name: 'Domů' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Tajná stránka' })).not.toBeInTheDocument();
        expect(await screen.findByText('Nemáte oprávnění pro zobrazení této stránky')).toBeInTheDocument();
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('insufficient permissions'), 'CAREGIVER', ' - ', '/secret');
    });

    it('does not let a client into an employee-only page', async () => {
        renderSecretPage({ authStatus: client(), allowedRoles: ['ADMIN', 'COORDINATOR', 'CAREGIVER'] });

        expect(await screen.findByRole('heading', { name: 'Domů' })).toBeInTheDocument();
    });

    it.each([
        ['an allowed role', coordinator(), ['ADMIN', 'COORDINATOR']],
        ['any role when no roles are listed', admin(), undefined],
    ])('shows the content to %s', async (_, authStatus, allowedRoles) => {
        renderSecretPage({ authStatus, allowedRoles });

        expect(await screen.findByRole('heading', { name: 'Tajná stránka' })).toBeInTheDocument();
    });
});
