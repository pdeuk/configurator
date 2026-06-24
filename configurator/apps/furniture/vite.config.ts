import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    appType: "spa",
    resolve: {
        alias: {
            "@configurator/core": path.resolve(packageDir, "../../packages/core/src")
        }
    }
});
