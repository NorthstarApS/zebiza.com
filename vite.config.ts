import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const wpProxy = {
  "/wp-json": {
    target: "https://zebiza.com",
    changeOrigin: true,
    secure: true,
  },
  "/wp-content": {
    target: "https://zebiza.com",
    changeOrigin: true,
    secure: true,
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: wpProxy,
  },
  preview: {
    host: "127.0.0.1",
    port: 8080,
    proxy: wpProxy,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
