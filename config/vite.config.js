import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { configDefaults, defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { readHttpUrl, readPort } from "./runtime.js";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const svelteConfigFile = fileURLToPath(
  new URL("../svelte.config.js", import.meta.url),
);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const apiPort = readPort(env.PORT, 3000, "PORT");

  return {
    root: projectRoot,
    plugins: [svelte({ configFile: svelteConfigFile })],
    resolve: {
      conditions: ["browser"],
    },
    server: {
      host: true,
      port: readPort(env.VITE_DEV_SERVER_PORT, 5173, "VITE_DEV_SERVER_PORT"),
      strictPort: true,
      proxy: {
        "/api": {
          target: readHttpUrl(
            env.VITE_API_PROXY_TARGET,
            `http://localhost:${apiPort}`,
            "VITE_API_PROXY_TARGET",
          ),
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./tests/setup.js",
      exclude: [...configDefaults.exclude, "e2e/**"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        thresholds: {
          statements: 80,
          branches: 68,
          functions: 70,
          lines: 80,
          "server/**": {
            statements: 69,
            branches: 66,
            functions: 57,
            lines: 71,
          },
          "src/utils/**": {
            statements: 90,
            branches: 80,
            functions: 90,
            lines: 90,
          },
          "src/App.svelte": {
            statements: 60,
            branches: 48,
            functions: 25,
            lines: 60,
          },
        },
        exclude: [
          "node_modules/",
          "tests/",
          "e2e/",
          "config/",
          "*.config.js",
          "dist/",
          "playwright-report/",
          "test-results/",
        ],
      },
    },
  };
});
