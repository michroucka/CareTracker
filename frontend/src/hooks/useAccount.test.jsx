import { act, renderHook } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccount } from './useAccount';
import { DELETE_PICTURE } from '@/lib/pictures';
import { toast } from '@/components/ui/sonner';
import { serveAndRecord, serverError } from '@/test/hooks';

beforeEach(() => {
    vi.spyOn(toast, 'success').mockImplementation(() => {});
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('useAccount', () => {
    it('loads the account details', async () => {
        serveAndRecord('get', '/user/me', () => HttpResponse.json({ email: 'jana@caretracker.test' }));
        const { result } = renderHook(useAccount);

        await expect(result.current.fetchAccountDetails()).resolves.toEqual({ email: 'jana@caretracker.test' });
    });

    it('shows an error toast and rethrows when the details fail to load', async () => {
        serveAndRecord('get', '/user/me', serverError('Databáze neodpovídá'));
        const { result } = renderHook(useAccount);

        await expect(result.current.fetchAccountDetails()).rejects.toThrow('Databáze neodpovídá');

        expect(toast.error).toHaveBeenCalledWith('Chyba načítání údajů', { description: 'Databáze neodpovídá' });
    });

    it('saves the account details', async () => {
        const requests = serveAndRecord('put', '/user/me', () => HttpResponse.json({ phone: '777123456' }));
        const { result } = renderHook(useAccount);

        await expect(result.current.updateAccountDetails({ phone: '777123456' })).resolves.toEqual({ phone: '777123456' });

        expect(requests[0].body).toEqual({ phone: '777123456' });
        expect(toast.success).toHaveBeenCalledWith('Údaje jsou uložené');
    });

    it.each([
        [true, 'success'],
        [false, 'error'],
    ])('shows the password reset answer (success: %s) as a %s toast', async (success, toastType) => {
        serveAndRecord('post', '/user/forgot-password', () => HttpResponse.json({ success, message: 'Odpověď serveru' }));
        const { result } = renderHook(useAccount);

        await act(() => result.current.requestResetPasswordEmail());

        expect(toast[toastType]).toHaveBeenCalledWith('Odpověď serveru');
        expect(result.current.isSendingReset).toBe(false);
    });

    it('is sending while the reset e-mail request runs', async () => {
        let answer;
        serveAndRecord('post', '/user/forgot-password', () => new Promise((resolve) => {
            answer = () => resolve(HttpResponse.json({ success: true, message: 'Odesláno' }));
        }));
        const { result } = renderHook(useAccount);

        let sending;
        act(() => {
            sending = result.current.requestResetPasswordEmail();
        });
        expect(result.current.isSendingReset).toBe(true);

        await vi.waitFor(() => expect(answer).toBeDefined());
        await act(async () => {
            answer();
            await sending;
        });
        expect(result.current.isSendingReset).toBe(false);
    });

    it('uploads a new own photo', async () => {
        const uploads = serveAndRecord('post', '/user/me/picture', () => HttpResponse.json({ id: 9 }));
        const { result } = renderHook(useAccount);

        await result.current.changeOwnPicture(new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }));

        expect(uploads).toHaveLength(1);
        expect(toast.success).toHaveBeenCalledWith('Fotka uložena');
    });

    it('removes the own photo', async () => {
        const deletions = serveAndRecord('delete', '/user/me/picture', () => new HttpResponse(null, { status: 204 }));
        const { result } = renderHook(useAccount);

        await result.current.changeOwnPicture(DELETE_PICTURE);

        expect(deletions).toHaveLength(1);
        expect(toast.success).toHaveBeenCalledWith('Fotka odebrána');
    });

    it('shows an error toast and rethrows when the photo cannot be saved', async () => {
        serveAndRecord('post', '/user/me/picture', serverError('Soubor je příliš velký', 413));
        const { result } = renderHook(useAccount);

        await expect(result.current.changeOwnPicture(new File(['photo'], 'photo.jpg'))).rejects.toThrow('Soubor je příliš velký');

        expect(toast.error).toHaveBeenCalledWith('Fotku se nepodařilo uložit', { description: 'Soubor je příliš velký' });
    });
});
