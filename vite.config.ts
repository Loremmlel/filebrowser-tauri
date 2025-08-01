import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const host = process.env.TAURI_DEV_HOST;
// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@/*": fileURLToPath(new URL("./src/*", import.meta.url)),
      "@assets/*": fileURLToPath(new URL("./src/assets/*", import.meta.url)),
      "@components/*": fileURLToPath(
        new URL("./src/components/*", import.meta.url)
      ),
      "@hooks/*": fileURLToPath(new URL("./src/hooks/*", import.meta.url)),
      "@types/*": fileURLToPath(new URL("./src/types/*", import.meta.url)),
      "@utils/*": fileURLToPath(new URL("./src/utils/*", import.meta.url)),
      "@stores/*": fileURLToPath(new URL("./src/stores/*", import.meta.url)),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
