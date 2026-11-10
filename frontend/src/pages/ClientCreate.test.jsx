import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ClientCreate } from './ClientCreate';
import { renderWithProviders } from '@/test/render';
import { serveAndRecord, serverError } from '@/test/hooks';
import { apiUrl, server } from '@/test/server';
import { admin } from '@/test/users';
import { toIsoDate } from '@/lib/dates';

const PLZEN = { id: 2, city: 'Plzeň' };
const KLATOVY = { id: 3, city: 'Klatovy' };

const firstOfThisMonth = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
};

function serveFormOptions() {
    server.use(
        http.get(apiUrl('/departments'), () => HttpResponse.json([PLZEN, KLATOVY])),
        http.get(apiUrl('/employees'), () => HttpResponse.json([
            { id: 10, firstName: 'Jana', lastName: 'Testová', department: PLZEN },
            { id: 11, firstName: 'Petr', lastName: 'Svoboda', department: KLATOVY },
        ])),
        http.get(apiUrl('/tasks'), () => HttpResponse.json([{ id: 40, name: 'Nákup' }, { id: 41, name: 'Úklid' }])),
    );
}

function renderCreateForm() {
    serveFormOptions();
    return renderWithProviders(
        <Routes>
            <Route path="/clients/new" element={<ClientCreate />} />
            <Route path="/clients/:clientId" element={<h1>Detail nového klienta</h1>} />
        </Routes>,
        { authStatus: admin(), route: '/clients/new' },
    );
}

const field = (label) => screen.getByLabelText(new RegExp(`^${label}`));
const submitButton = () => screen.getByRole('button', { name: 'Vytvořit klienta' });

async function pickFirstDayOfThisMonth(user) {
    await user.click(field('Datum narození'));
    const dayLabel = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(firstOfThisMonth());
    await user.click(screen.getByRole('button', { name: new RegExp(`, ${dayLabel}$`) }));
}

// pasting instead of typing key by key keeps the long form fast enough for slower CI runners
async function enterText(user, element, text) {
    await user.click(element);
    await user.paste(text);
}

async function fillRequiredFields(user) {
    await enterText(user, field('Jméno'), ' Marie ');
    await enterText(user, field('Příjmení'), 'Nová');
    await user.click(field('Pohlaví'));
    await user.click(screen.getByRole('option', { name: 'Žena' }));
    await pickFirstDayOfThisMonth(user);
    await user.click(field('Klíčový pracovník'));
    await user.click(screen.getByRole('option', { name: 'Jana Testová' }));
    await enterText(user, field('Ulice a číslo popisné'), 'Americká 12');
    await enterText(user, field('Město'), 'Plzeň');
    await enterText(user, field('PSČ'), '30100');
}

describe('ClientCreate', () => {
    it('requires the mandatory fields and sends nothing', async () => {
        const creations = serveAndRecord('post', '/clients');
        const { user } = renderCreateForm();

        await user.click(await screen.findByRole('button', { name: 'Vytvořit klienta' }));

        for (const message of [
            'Prosím zadejte jméno',
            'Prosím zadejte příjmení',
            'Prosím vyberte pohlaví',
            'Prosím zadejte datum narození',
            'Prosím vyberte klíčového pracovníka',
            'Prosím zadejte ulici a číslo popisné',
            'Prosím zadejte město',
            'Prosím zadejte PSČ',
        ]) {
            expect(screen.getByText(message)).toBeInTheDocument();
        }
        // the admin's own department is preselected
        expect(screen.queryByText('Prosím vyberte středisko')).not.toBeInTheDocument();
        expect(field('Jméno')).toHaveAttribute('aria-invalid', 'true');
        expect(field('Jméno')).toHaveFocus();
        expect(creations).toHaveLength(0);
    });

    it('checks the format of postal code, phone, e-mail and personal number', async () => {
        const creations = serveAndRecord('post', '/clients');
        const { user } = renderCreateForm();
        await screen.findByRole('button', { name: 'Vytvořit klienta' });
        await fillRequiredFields(user);

        await user.clear(field('PSČ'));
        await enterText(user, field('PSČ'), '301');
        await enterText(user, field('Telefon'), '12345');
        await enterText(user, field('E-mail'), 'marie@seznam');
        await enterText(user, field('Osobní číslo'), '0');
        await user.click(submitButton());

        expect(screen.getByText('PSČ ve tvaru 123 45')).toBeInTheDocument();
        expect(screen.getByText('Telefon ve tvaru 123 456 789 nebo +420 123 456 789')).toBeInTheDocument();
        expect(screen.getByText('Zadejte platnou e-mailovou adresu')).toBeInTheDocument();
        expect(screen.getByText('Osobní číslo musí být mezi 1 a 999999')).toBeInTheDocument();
        expect(creations).toHaveLength(0);
    });

    it('keeps the personal number to at most six digits', async () => {
        const { user } = renderCreateForm();
        await screen.findByRole('button', { name: 'Vytvořit klienta' });

        await user.type(field('Osobní číslo'), '12a34567');

        expect(field('Osobní číslo')).toHaveValue('123456');
    });

    it('offers only caregivers of the chosen department', async () => {
        const { user } = renderCreateForm();
        await screen.findByRole('button', { name: 'Vytvořit klienta' });

        await user.click(field('Klíčový pracovník'));
        expect(screen.getByRole('option', { name: 'Jana Testová' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Petr Svoboda' })).not.toBeInTheDocument();
    });

    it('sends the filled form as JSON and opens the new client', async () => {
        const creations = serveAndRecord('post', '/clients', () => HttpResponse.json({ id: 55, firstName: 'Marie', lastName: 'Nová' }));
        const { user } = renderCreateForm();
        await screen.findByRole('button', { name: 'Vytvořit klienta' });
        await fillRequiredFields(user);

        await enterText(user, field('Telefon'), '+420777123456');
        await enterText(user, field('E-mail'), 'marie@example.cz');
        await enterText(user, field('Osobní číslo'), '42');
        await user.click(field('Úkony'));
        await user.click(screen.getByRole('option', { name: 'Úklid' }));
        await user.keyboard('{Escape}');
        await user.click(submitButton());

        expect(await screen.findByRole('heading', { name: 'Detail nového klienta' })).toBeInTheDocument();
        expect(window.location.pathname).toBe('/clients/55');
        expect(screen.getByText('Klient úspěšně vytvořen')).toBeInTheDocument();
        expect(creations).toHaveLength(1);
        expect(creations[0].body).toEqual({
            firstName: 'Marie',
            lastName: 'Nová',
            gender: 'FEMALE',
            dateOfBirth: toIsoDate(firstOfThisMonth()),
            personalNumber: 42,
            departmentId: 2,
            caregiverId: 10,
            street: 'Americká 12',
            city: 'Plzeň',
            postalCode: '301 00',
            email: 'marie@example.cz',
            phone: '+420 777 123 456',
            legallyCompetent: true,
            benefits: 'NONE',
            taskIds: [41],
            relativesContact: null,
            generalPractitioner: null,
            notes: null,
            terminationDate: null,
            terminationReason: null,
        });
    });

    it('shows the server message and stays on the form when saving fails', async () => {
        serveAndRecord('post', '/clients', serverError('Klient s tímto osobním číslem už existuje', 409));
        const { user } = renderCreateForm();
        await screen.findByRole('button', { name: 'Vytvořit klienta' });
        await fillRequiredFields(user);

        await user.click(submitButton());

        expect(await screen.findByText('Chyba při vytváření klienta')).toBeInTheDocument();
        expect(screen.getByText('Klient s tímto osobním číslem už existuje')).toBeInTheDocument();
        expect(window.location.pathname).toBe('/clients/new');
        await waitFor(() => expect(submitButton()).toBeEnabled());
        expect(field('Jméno')).toHaveValue(' Marie ');
    });
});
