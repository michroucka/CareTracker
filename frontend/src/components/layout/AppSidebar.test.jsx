import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { admin, caregiver, client, superadmin } from '@/test/users';

const STAFF_ITEMS = ['Nástěnka', 'Klienti', 'Provedené úkony', 'Zaměstnanci', 'Úkony'];

function renderSidebar(authStatus, route = '/') {
    return renderWithProviders(<SidebarProvider><AppSidebar /></SidebarProvider>, { authStatus, route });
}

async function navItemNames() {
    const firstItem = await screen.findByRole('link', { name: /Nástěnka|Měsíční přehled/ });
    const menu = firstItem.closest('ul');
    return within(menu).getAllByRole('link').map((link) => link.textContent);
}

describe('AppSidebar', () => {
    it('shows a caregiver only the everyday lists', async () => {
        renderSidebar(caregiver());

        expect(await navItemNames()).toEqual(STAFF_ITEMS);
    });

    it('adds departments for an admin', async () => {
        renderSidebar(admin());

        expect(await navItemNames()).toEqual([...STAFF_ITEMS, 'Střediska']);
    });

    it('adds departments, organizations and the organization switcher for a superadmin', async () => {
        server.use(http.get(apiUrl('/organizations'), () => HttpResponse.json([{ id: 3, name: 'Charita Plzeň' }])));
        renderSidebar(superadmin());

        expect(await navItemNames()).toEqual([...STAFF_ITEMS, 'Střediska', 'Organizace']);
        expect(screen.getByRole('button', { name: 'Vyberte organizaci' })).toBeInTheDocument();
    });

    it('shows a client only the monthly report', async () => {
        renderSidebar(client());

        expect(await navItemNames()).toEqual(['Měsíční přehled']);
        expect(screen.queryByRole('button', { name: 'Vyberte organizaci' })).not.toBeInTheDocument();
    });

    it('marks the current section, including its subpages', async () => {
        renderSidebar(caregiver(), '/clients/7');

        expect(await screen.findByRole('link', { name: 'Klienti' })).toHaveAttribute('data-active', 'true');
        expect(screen.getByRole('link', { name: 'Nástěnka' })).toHaveAttribute('data-active', 'false');
    });

    it('shows who is signed in with a link to the account', async () => {
        renderSidebar(caregiver());

        expect(await screen.findByRole('link', { name: /Jana Testová/ })).toHaveAttribute('href', '/account');
    });
});
