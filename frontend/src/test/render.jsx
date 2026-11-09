import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { authStatusHandler, loggedOut, server } from './server';

/**
 * Renders UI inside the same providers as the app. The logged-in user comes from a mocked
 * /api/auth-status response, so AuthProvider runs its real code path.
 * Wait for something user-specific to appear before asserting, auth state loads asynchronously.
 */
export function renderWithProviders(ui, { authStatus = loggedOut, route = '/' } = {}) {
    server.use(authStatusHandler(authStatus));

    return {
        user: userEvent.setup(),
        ...render(
            <MemoryRouter initialEntries={[route]}>
                <ThemeProvider>
                    <AuthProvider>
                        <TooltipProvider>
                            <Toaster />
                            {ui}
                        </TooltipProvider>
                    </AuthProvider>
                </ThemeProvider>
            </MemoryRouter>,
        ),
    };
}
