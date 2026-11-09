import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PersonAvatar } from './PersonAvatar';

describe('PersonAvatar', () => {
    it.each([
        ['Jana Testová', 'JT'],
        ['Jan Amos Komenský', 'JK'],
        ['  marie   nová ', 'MN'],
        ['Čeněk', 'Č'],
    ])('shows initials of "%s" as %s without a photo', (name, initials) => {
        const { container } = render(<PersonAvatar name={name} />);

        expect(container).toHaveTextContent(initials);
        expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it.each([undefined, '', '   '])('shows a person icon when the name is %j', (name) => {
        const { container } = render(<PersonAvatar name={name} />);

        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container).toHaveTextContent('');
    });

    it('shows the photo as decoration instead of the initials', () => {
        const { container } = render(<PersonAvatar name="Jana Testová" src="/api/employees/10/picture?size=thumb&v=1" />);

        const photo = container.querySelector('img');
        expect(photo).toHaveAttribute('src', '/api/employees/10/picture?size=thumb&v=1');
        expect(photo).toHaveAttribute('alt', '');
        expect(container).not.toHaveTextContent('JT');
    });
});
