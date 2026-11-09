import { describe, expect, it } from 'vitest';
import { getBreadcrumbs, listLocation, rememberListLocation } from './navigation';

describe('list location', () => {
    it('falls back to the plain list path', () => {
        expect(listLocation('/clients')).toBe('/clients');
    });

    it('keeps the filters of the last visited list', () => {
        rememberListLocation('/clients', '?status=all&departments=1,4&search=nov');

        expect(listLocation('/clients')).toBe('/clients?status=all&departments=1%2C4&search=nov');
    });

    it('drops the opened record sheet', () => {
        rememberListLocation('/employees', '?status=true&detail=12');

        expect(listLocation('/employees')).toBe('/employees?status=true');
    });

    it('ignores pages that are not lists', () => {
        rememberListLocation('/clients/7', '?tab=plan');
        rememberListLocation('/', '?view=mine');

        expect(listLocation('/clients')).toBe('/clients');
        expect(listLocation('/')).toBe('/');
    });

    it('lists without filters are remembered as the plain path', () => {
        rememberListLocation('/clients', '?status=false');
        rememberListLocation('/clients', '');

        expect(listLocation('/clients')).toBe('/clients');
    });
});

describe('getBreadcrumbs', () => {
    it('links client pages back to the filtered client list', () => {
        rememberListLocation('/clients', '?status=false');

        expect(getBreadcrumbs('/clients/7')[0]).toEqual({ label: 'Klienti', to: '/clients?status=false' });
        expect(getBreadcrumbs('/clients/7/individual-plan')[0].to).toBe('/clients?status=false');
        expect(getBreadcrumbs('/clients/new')[0].to).toBe('/clients?status=false');
    });

    it('links the plan back to the client detail', () => {
        expect(getBreadcrumbs('/clients/7/individual-plan')[1]).toEqual({ label: 'Detail klienta', to: '/clients/7' });
    });
});
