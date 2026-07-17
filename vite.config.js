import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Cast to any to allow Vitest-specific `test` config without type errors
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        open: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        css: true,
    },
});
