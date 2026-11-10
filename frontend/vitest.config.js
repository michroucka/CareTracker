import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(viteConfig, defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        env: {
            VITE_API_URL: 'http://localhost:3000/api',
        },
        include: ['src/**/*.test.{js,jsx}'],
        // page tests take up to ~2 s locally and CI runners are several times slower at peak times
        testTimeout: 15000,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            exclude: ['src/test/**', 'src/**/*.test.{js,jsx}', 'src/components/ui/**', 'src/pages/ComponentCatalog.jsx'],
            reporter: ['text-summary', 'html', 'json-summary'],
            // just below the coverage reached after phase T3; only ever raised
            thresholds: {
                lines: 91,
                statements: 91,
                branches: 91,
                functions: 84,
            },
        },
    },
}));
