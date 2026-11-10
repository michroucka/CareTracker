import {useCallback, useSyncExternalStore} from 'react';

/**
 * Returns true when the given CSS media query matches.
 * @param {string} query CSS media query string (e.g. "(max-width: 640px)")
 * @returns {boolean}
 */
export function useMediaQuery(query) {
    const subscribe = useCallback((onChange) => {
        const media = window.matchMedia(query);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [query]);

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(max-width: 768px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
