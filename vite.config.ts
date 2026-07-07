import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const host = process.env.TAURI_DEV_HOST;

/**
 * Injeta o script do React DevTools standalone (`npm run devtools`, que
 * roda `react-devtools` e escuta em localhost:8097) antes de qualquer
 * outro script da página, para a conexão ser estabelecida assim que o
 * app inicializa. Só roda em modo `serve` (`vite` / `tauri dev`), nunca
 * em build de produção.
 *
 * TEMPORÁRIO: remover este plugin (e a dependência `react-devtools` do
 * package.json) depois de terminar o profiling de performance.
 */
const reactDevTools = (): Plugin => ({
  name: 'react-devtools',
  apply: 'serve',
  transformIndexHtml() {
    return [
      {
        tag: 'script',
        attrs: { src: 'http://localhost:8097' },
        // head-prepend garante que carregue ANTES do bundle do React,
        // que é exigido pelo react-devtools-core para conseguir "ver"
        // a árvore de componentes desde o primeiro render.
        injectTo: 'head-prepend',
      },
    ];
  },
});

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss(), reactDevTools()],

  // Configuração de alias para Shadcn UI
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}));
