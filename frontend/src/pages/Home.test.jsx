import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import { renderWithProviders } from '@/test/render';
import { currentSearchParams, serveAndRecord, serverError } from '@/test/hooks';
import { loggedOut } from '@/test/server';
import { admin, caregiver, client, coordinator, superadmin } from '@/test/users';

const twelveMonths = (lastValue) => [...Array(11).fill(10), lastValue];

const staffBasics = {
    tasksPerformedCount: 42,
    tasksPerformedCountHistory: twelveMonths(42),
    clientIPUpdates: [{ clientId: 7, clientName: 'Marie Nová', plannedUpdateDate: '2020-01-01' }],
    clientsWithoutRecentRecords: [{ clientId: 8, clientName: 'Josef Starý', lastRecordDate: null }],
    clientsWithoutRecentRecordsCount: 3,
    recentPerformedTasks: [{ id: 1, clientName: 'Marie Nová', taskName: 'Nákup', unitCount: 30, unitType: 'MINUTES', date: '2026-11-02' }],
};

const mineView = (availableViews = ['MINE']) => ({
    ...staffBasics,
    view: 'MINE',
    availableViews,
    myClientsCount: 5,
    totalMonthMinutes: 600,
    todayTasksCount: 3,
    todayMinutes: 90,
});

const departmentView = (availableViews = ['DEPARTMENT', 'MINE']) => ({
    ...staffBasics,
    view: 'DEPARTMENT',
    availableViews,
    clientCount: 12,
    totalMonthlyIncome: 15000,
    monthlyIncomeHistory: twelveMonths(15000),
    caregiverWorkload: [
        { employeeId: 1, name: 'Petra Pilná', tasksCount: 20, minutes: 300 },
        { employeeId: 2, name: 'Tomáš Tichý', tasksCount: 5, minutes: 0 },
    ],
});

const organizationView = {
    ...staffBasics,
    view: 'ORGANIZATION',
    availableViews: ['ORGANIZATION', 'DEPARTMENT', 'MINE'],
    clientCount: 40,
    employeeCount: 15,
    departmentCount: 2,
    totalMonthlyIncome: 80000,
    monthlyIncomeHistory: twelveMonths(80000),
    tasksPerformedByDepartment: [
        { departmentName: 'Plzeň-sever', performedTasksCount: 30, income: 50000 },
        { departmentName: 'Plzeň-jih', performedTasksCount: 12, income: 30000 },
    ],
};

const platformOverview = {
    platform: {
        organizationCount: 2,
        departmentCount: 5,
        employeeCount: 30,
        clientCount: 120,
        tasksThisMonth: 400,
        tasksHistory: twelveMonths(400),
        activeUsersByRole: { ADMIN: 2, COORDINATOR: 3, CAREGIVER: 20 },
        pendingActivationCount: 2,
        expiredActivationCount: 1,
        organizations: [
            { id: 1, name: 'Charita Plzeň', departmentCount: 3, employeeCount: 20, clientCount: 80, tasksThisMonth: 300, lastActivity: null },
        ],
    },
};

/** Serves /dashboard with a response per requested view (`null` for the request without a view). */
function serveDashboard(byView) {
    return serveAndRecord('get', '/dashboard', ({ request }) => {
        const view = new URL(request.url).searchParams.get('view');
        return HttpResponse.json(byView[view] ?? byView[null]);
    });
}

function renderHome(authStatus, route = '/') {
    return renderWithProviders(
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<h1>Přihlášení</h1>} />
            <Route path="/monthly-report" element={<h1>Měsíční přehled</h1>} />
        </Routes>,
        { authStatus, route },
    );
}

const viewSwitcher = () => screen.queryByRole('group', { name: 'Pohled nástěnky' });
const viewButton = (name) => within(viewSwitcher()).getByRole('button', { name });

describe('Home dashboard', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        // recharts warns that its container has no size, which jsdom cannot give it
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    it("shows a caregiver their own work without a view switcher", async () => {
        const requests = serveDashboard({ null: mineView() });
        renderHome(caregiver());

        expect(await screen.findByText('3 úkony')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Jana$/ })).toBeInTheDocument();
        expect(screen.getByText('1 h 30 min u klientů')).toBeInTheDocument();
        expect(screen.getByText('5 mých klientů')).toBeInTheDocument();
        expect(screen.getByText('Moje úkony')).toBeInTheDocument();
        expect(screen.getByText('Moje nedávné záznamy')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Marie Nová/ })).toHaveAttribute('href', '/clients/7/individual-plan');
        expect(screen.getByRole('link', { name: /Josef Starý/ })).toHaveAttribute('href', '/clients/8');
        expect(screen.getByText('a 2 další klienti')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Zapsat úkon/ })).toHaveAttribute('href', '/performed-tasks?openCreate=true');
        expect(viewSwitcher()).not.toBeInTheDocument();
        expect(requests[0].searchParams.has('view')).toBe(false);
    });

    it("shows a coordinator the department with the caregivers' workload", async () => {
        serveDashboard({ null: departmentView() });
        renderHome(coordinator());

        expect(await screen.findByText('Vytížení pečovatelů')).toBeInTheDocument();
        expect(screen.getByText('Klienti ve středisku')).toBeInTheDocument();
        expect(screen.getByText('průměrně 6 klientů na pečovatele')).toBeInTheDocument();
        expect(screen.getByText('Příjmy střediska')).toBeInTheDocument();
        expect(screen.getByText('Petra Pilná')).toBeInTheDocument();
        expect(screen.getByText('Tomáš Tichý')).toBeInTheDocument();
        expect(viewButton('Středisko')).toHaveAttribute('aria-pressed', 'true');
        expect(viewButton('Moje práce')).toHaveAttribute('aria-pressed', 'false');
        expect(within(viewSwitcher()).queryByRole('button', { name: 'Organizace' })).not.toBeInTheDocument();
    });

    it('shows an admin the whole organization with all three views', async () => {
        serveDashboard({ null: organizationView });
        renderHome(admin());

        expect(await screen.findByText('Aktivní klienti')).toBeInTheDocument();
        expect(screen.getByText('15 zaměstnanců v 2 střediscích')).toBeInTheDocument();
        expect(screen.getByText('Příjmy organizace')).toBeInTheDocument();
        expect(screen.getByText('Plzeň-sever')).toBeInTheDocument();
        expect(viewButton('Organizace')).toHaveAttribute('aria-pressed', 'true');
        expect(within(viewSwitcher()).getAllByRole('button')).toHaveLength(3);
    });

    it('switches the view, remembers it in the URL and for the next visit', async () => {
        const requests = serveDashboard({ null: departmentView(), MINE: mineView(['DEPARTMENT', 'MINE']) });
        const { user } = renderHome(coordinator());

        await screen.findByText('Vytížení pečovatelů');
        await user.click(viewButton('Moje práce'));

        expect(await screen.findByText('Moje úkony')).toBeInTheDocument();
        expect(screen.queryByText('Vytížení pečovatelů')).not.toBeInTheDocument();
        expect(viewButton('Moje práce')).toHaveAttribute('aria-pressed', 'true');
        expect(currentSearchParams().get('view')).toBe('mine');
        expect(requests.at(-1).searchParams.get('view')).toBe('MINE');
        expect(localStorage.getItem('dashboard_view')).toBe('MINE');
    });

    it('does not reload when the shown view is clicked again', async () => {
        const requests = serveDashboard({ null: departmentView() });
        const { user } = renderHome(coordinator());

        await screen.findByText('Vytížení pečovatelů');
        await user.click(viewButton('Středisko'));

        expect(requests).toHaveLength(1);
        expect(currentSearchParams().has('view')).toBe(false);
    });

    it('opens the view from ?view= in the URL', async () => {
        const requests = serveDashboard({ DEPARTMENT: departmentView(['ORGANIZATION', 'DEPARTMENT', 'MINE']) });
        renderHome(admin(), '/?view=department');

        expect(await screen.findByText('Vytížení pečovatelů')).toBeInTheDocument();
        expect(requests[0].searchParams.get('view')).toBe('DEPARTMENT');
        expect(viewButton('Středisko')).toHaveAttribute('aria-pressed', 'true');
    });

    it('opens the remembered view when the URL has none', async () => {
        localStorage.setItem('dashboard_view', 'MINE');
        const requests = serveDashboard({ MINE: mineView(['ORGANIZATION', 'DEPARTMENT', 'MINE']) });
        renderHome(admin());

        expect(await screen.findByText('Moje úkony')).toBeInTheDocument();
        expect(requests[0].searchParams.get('view')).toBe('MINE');
    });

    it('shows the view the server falls back to when the requested one is not allowed', async () => {
        const requests = serveDashboard({ ORGANIZATION: mineView() });
        renderHome(caregiver(), '/?view=organization');

        expect(await screen.findByText('Moje úkony')).toBeInTheDocument();
        expect(requests[0].searchParams.get('view')).toBe('ORGANIZATION');
        expect(viewSwitcher()).not.toBeInTheDocument();
    });

    it('shows the superadmin a platform overview without client data or actions', async () => {
        serveDashboard({ null: platformOverview });
        renderHome(superadmin());

        expect(await screen.findByRole('heading', { name: 'Přehled aplikace' })).toBeInTheDocument();
        expect(await screen.findByRole('cell', { name: 'Charita Plzeň' })).toBeInTheDocument();
        expect(screen.getByText('Uživatelské účty')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('2 čekají na aktivaci')).toBeInTheDocument();
        expect(screen.getByText('1 prošlá')).toBeInTheDocument();
        expect(viewSwitcher()).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Zapsat úkon/ })).not.toBeInTheDocument();
    });

    it('sends a client to the monthly report, which is their home', async () => {
        renderHome(client());

        expect(await screen.findByRole('heading', { name: 'Měsíční přehled' })).toBeInTheDocument();
    });

    it('sends a logged out visitor to the login', async () => {
        renderHome(loggedOut);

        expect(await screen.findByRole('heading', { name: 'Přihlášení' })).toBeInTheDocument();
    });

    it('tells the user when the dashboard cannot be loaded', async () => {
        serveAndRecord('get', '/dashboard', serverError('Databáze neodpovídá'));
        renderHome(caregiver());

        expect(await screen.findByText('Chyba při načítání nástěnky')).toBeInTheDocument();
        expect(screen.getByText('Databáze neodpovídá')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByLabelText('Načítání nástěnky')).toBeInTheDocument());
    });
});
