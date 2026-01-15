import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as pkg from "./package.json";
import * as child from "child_process";
import tailwindcss from "@tailwindcss/vite";

const commitHash = () => {
  try {
    return child.execSync("git rev-parse --short HEAD").toString().trim();
  } catch (error) {
    console.error("Error getting Git commit hash:", error);
    return "unknown";
  }
};

const host = process.env.TAURI_DEV_HOST;
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 14200,
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
    plugins: [react(), tailwindcss()],
    clearScreen: false,
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      __TAURI_ENV_TARGET_TRIPLE__: JSON.stringify(
        process.env.TAURI_ENV_TARGET_TRIPLE,
      ),
      __TAURI_ENV_PLATFORM_VERSION__: JSON.stringify(
        process.env.TAURI_ENV_PLATFORM_VERSION,
      ),
      __TAURI_ENV_DEBUG__:
        JSON.stringify(process.env.TAURI_ENV_DEBUG) === "true",
      __APP_VERSION__: JSON.stringify(pkg.version),
      __COMMIT_HASH__: JSON.stringify(commitHash()),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
