import { useState, useEffect } from 'react';

/**
 * Hook pro detekci media query
 * @param {string} query - CSS media query (např. "(max-width: 640px)")
 * @returns {boolean} - true pokud query matchuje
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        // Nastav initial hodnotu
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        // Listener pro změny
        const listener = () => setMatches(media.matches);

        // Modern API
        if (media.addEventListener) {
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        }
        // Fallback pro starší prohlížeče
        else {
            media.addListener(listener);
            return () => media.removeListener(listener);
        }
    }, [matches, query]);

    return matches;
}

/**
 * Hotové helper hooky
 */
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');
export const useIsTablet = () => useMediaQuery('(max-width: 768px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
