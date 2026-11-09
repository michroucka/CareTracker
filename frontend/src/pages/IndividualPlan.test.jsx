import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import IndividualPlan from './IndividualPlan';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { caregiver } from '@/test/users';

const CAREGIVER_ID = 10;

function client({ active }) {
    return {
        id: 7,
        firstName: 'Marie',
        lastName: 'Nová',
        active,
        street: 'Americká 12',
        city: 'Plzeň',
        postalCode: '301 00',
        benefits: 'TWO',
        legallyCompetent: true,
        pictureId: null,
        department: { id: 2, city: 'Plzeň' },
        caregiver: { id: CAREGIVER_ID, fullName: 'Jana Testová' },
    };
}

const plan = {
    id: 1,
    currentContent: { versionNumber: 1, processedDate: '2026-01-15', plannedUpdateDate: '2026-12-31', likes: 'Procházky' },
    dailyRecords: [{ id: 5, date: '2026-11-02', content: 'Nákup a úklid', createdBy: { id: CAREGIVER_ID, fullName: 'Jana Testová' } }],
};

function serveClient(clientData, planData = plan) {
    server.use(
        http.get(apiUrl('/clients/7'), () => HttpResponse.json(clientData)),
        http.get(apiUrl('/clients/7/individual-plan'), () => planData
            ? HttpResponse.json(planData)
            : HttpResponse.json({ message: 'Not found' }, { status: 404 })),
        http.get(apiUrl('/clients/7/individual-plan/history'), () => HttpResponse.json([{ versionNumber: 1, processedDate: '2026-01-15' }])),
    );
}

function renderPlanAsClientsCaregiver() {
    return renderWithProviders(
        <Routes>
            <Route path="/clients/:clientId/individual-plan" element={<IndividualPlan />} />
        </Routes>,
        { authStatus: caregiver({ employeeId: CAREGIVER_ID }), route: '/clients/7/individual-plan' },
    );
}

describe('IndividualPlan', () => {
    it("lets the client's caregiver add a version and daily records", async () => {
        serveClient(client({ active: true }));

        renderPlanAsClientsCaregiver();

        expect(await screen.findByRole('button', { name: /Nová verze/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Přidat záznam/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Akce pro záznam/ })).toBeInTheDocument();
    });

    it('is read-only for a terminated client', async () => {
        serveClient(client({ active: false }));

        renderPlanAsClientsCaregiver();

        expect(await screen.findByText(/Klient je ukončený/)).toBeInTheDocument();
        expect(screen.getByText('Nákup a úklid')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Nová verze/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Přidat záznam/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Akce pro záznam/ })).not.toBeInTheDocument();
    });

    it('does not offer to create a plan for a terminated client', async () => {
        serveClient(client({ active: false }), null);

        renderPlanAsClientsCaregiver();

        expect(await screen.findByText('Klient je ukončený, plán už nejde vytvořit.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Vytvořit plán/ })).not.toBeInTheDocument();
    });
});
