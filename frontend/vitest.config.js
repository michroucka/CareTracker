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
            // just below the coverage measured by Vitest 5 (AST-based v8 remapping counts statements and branches
            // differently than Vitest 3: same 117 files, lines / branches / functions / statements 90.1 / 85.7 / 81.9 / 88.8 %
            // instead of 91.4 / 92.0 / 84.5 / 91.4 %);
            // only ever raised
            thresholds: {
                lines: 90,
                statements: 88,
                branches: 85,
                functions: 81,
            },
        },
    },
}));
