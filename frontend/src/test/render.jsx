import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { authStatusHandler, loggedOut, server } from './server';

// like ProtectedRoute in the app: pages expect the user to be loaded before they render
function WhenAuthLoaded({ children }) {
    const { loading } = useAuth();
    return loading ? null : children;
}

/**
 * Renders UI inside the same providers as the app. The logged-in user comes from a mocked
 * /api/auth-status response, so AuthProvider runs its real code path.
 * The UI renders once auth has loaded, so wait for it with findBy* queries.
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
                            <WhenAuthLoaded>{ui}</WhenAuthLoaded>
                        </TooltipProvider>
                    </AuthProvider>
                </ThemeProvider>
            </MemoryRouter>,
        ),
    };
}
