import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const openwaUrl = env.OPENWA_URL || 'http://localhost:2785';
  const openwaApiKey = env.OPENWA_API_KEY || '';
  const openwaSessionId = env.OPENWA_SESSION_ID || '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_OPENWA_URL': JSON.stringify(openwaUrl),
      'import.meta.env.VITE_OPENWA_API_KEY': JSON.stringify(openwaApiKey),
      'import.meta.env.VITE_OPENWA_SESSION_ID': JSON.stringify(openwaSessionId),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: openwaUrl,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
