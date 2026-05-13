import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // Separa el core de React
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            // Separa UI y estilos
            if (id.includes("sileo") || id.includes("lucide-react")) {
              return "vendor-ui";
            }
            // Resto de dependencias
            return "vendor-core";
          }
        },
      },
    },
  },
});
