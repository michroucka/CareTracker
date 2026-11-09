import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DELETE_PICTURE, shrinkPhoto } from '@/lib/pictures';
import { PhotoInput } from './PhotoInput';

vi.mock('@/lib/pictures', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, shrinkPhoto: vi.fn(actual.shrinkPhoto) };
});

const SAVED_PHOTO_URL = 'http://localhost:3000/api/clients/7/picture?size=thumb&v=3';

function renderPhotoInput(props) {
    // the input accepts image/* only in the file dialog; a dropped file or "All files" in the dialog skips that
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();
    render(
        <ThemeProvider>
            <Toaster />
            <PhotoInput id="photo" name="Marie Nová" value={null} onChange={onChange} {...props} />
        </ThemeProvider>,
    );
    return { user, onChange, fileInput: document.getElementById('photo') };
}

// the avatar is a mouse and drop target hidden from assistive technology; the labelled button does the same
const avatarButton = () => document.querySelector('button[aria-hidden="true"]');

function fileOfSize(name, type, sizeInBytes) {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: sizeInBytes });
    return file;
}

describe('PhotoInput', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    // after the shared cleanup has unmounted the preview, which revokes its object URL
    afterAll(() => {
        delete URL.createObjectURL;
        delete URL.revokeObjectURL;
    });

    it('shows the initials and an upload button without a photo', () => {
        renderPhotoInput();

        expect(avatarButton()).toHaveTextContent('MN');
        expect(avatarButton()).toHaveAttribute('tabindex', '-1');
        expect(screen.getAllByRole('button', { name: 'Nahrát fotografii' })).toHaveLength(1);
        expect(screen.queryByRole('button', { name: /Odebrat/ })).not.toBeInTheDocument();
    });

    it('rejects a file that is not an image', async () => {
        const { user, onChange, fileInput } = renderPhotoInput();

        await user.upload(fileInput, new File(['%PDF'], 'smlouva.pdf', { type: 'application/pdf' }));

        expect(await screen.findByText('Fotku nejde použít')).toBeInTheDocument();
        expect(screen.getByText('Vyberte prosím obrázek (JPG, PNG, GIF nebo WebP).')).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('explains an image format the browser cannot open', async () => {
        vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('unsupported')));
        const { user, onChange, fileInput } = renderPhotoInput();

        await user.upload(fileInput, new File(['heic'], 'IMG_0001.HEIC', { type: 'image/heic' }));

        expect(await screen.findByText(/Tento formát fotky prohlížeč neumí otevřít/)).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('rejects a file over the size limit', async () => {
        const { user, onChange, fileInput } = renderPhotoInput();

        await user.upload(fileInput, fileOfSize('obrovska.jpg', 'image/jpeg', 51 * 1024 * 1024));

        expect(await screen.findByText('Soubor je příliš velký. Maximum je 50 MB.')).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('passes the shrunk photo to onChange', async () => {
        const shrunk = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });
        shrinkPhoto.mockResolvedValueOnce(shrunk);
        const { user, onChange, fileInput } = renderPhotoInput();
        const original = new File(['png'], 'portret.png', { type: 'image/png' });

        await user.upload(fileInput, original);

        expect(shrinkPhoto).toHaveBeenCalledWith(original);
        expect(onChange).toHaveBeenCalledWith(shrunk);
    });

    it('accepts a photo dropped on the avatar', async () => {
        const shrunk = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });
        shrinkPhoto.mockResolvedValueOnce(shrunk);
        const { onChange } = renderPhotoInput();
        const dropped = new File(['png'], 'portret.png', { type: 'image/png' });

        fireEvent.drop(avatarButton(), { dataTransfer: { files: [dropped] } });

        await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(shrunk));
    });

    it('ignores a dropped photo when disabled', () => {
        const { onChange } = renderPhotoInput({ disabled: true });

        fireEvent.drop(avatarButton(), { dataTransfer: { files: [new File(['png'], 'a.png', { type: 'image/png' })] } });

        expect(shrinkPhoto).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('shows the saved photo and asks the server to delete it on removal', async () => {
        const { user, onChange } = renderPhotoInput({ value: SAVED_PHOTO_URL, hasSavedPicture: true });

        expect(avatarButton().querySelector('img')).toHaveAttribute('src', SAVED_PHOTO_URL);

        await user.click(screen.getByRole('button', { name: 'Odebrat' }));

        expect(onChange).toHaveBeenCalledWith(DELETE_PICTURE);
    });

    it('just clears a photo that was never saved', async () => {
        // jsdom has no object URLs; the preview of an unsaved File needs one
        URL.createObjectURL = () => 'blob:preview';
        URL.revokeObjectURL = () => {};
        const { user, onChange } = renderPhotoInput({ value: new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' }), hasSavedPicture: false });

        await user.click(screen.getByRole('button', { name: 'Odebrat' }));

        expect(onChange).toHaveBeenCalledWith(null);
    });
});
