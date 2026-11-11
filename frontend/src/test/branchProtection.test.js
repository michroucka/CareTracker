import { expect, it } from 'vitest';

// Deliberately failing: verifies that a pull request with a broken test cannot be merged
it('fails on purpose', () => {
    expect(1).toBe(2);
});
