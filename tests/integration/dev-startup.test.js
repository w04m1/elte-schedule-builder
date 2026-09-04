import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

let developmentProcess;

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function waitForDemoApi(url, output) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (developmentProcess.exitCode !== null) {
      throw new Error(`Development process exited early.\n${output.value}`);
    }

    try {
      const response = await fetch(url);
      const body = await response.text();
      if (response.ok && body.includes("Introduction to Web Development")) {
        return;
      }
    } catch {
      // Both servers can still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for the proxied API.\n${output.value}`);
}

afterEach(async () => {
  if (!developmentProcess || developmentProcess.exitCode !== null) return;
  developmentProcess.kill("SIGTERM");
  await new Promise((resolve) => developmentProcess.once("exit", resolve));
  developmentProcess = undefined;
});

describe("development startup", () => {
  it("starts the frontend and API together and proxies to a custom API port", async () => {
    const apiPort = await reservePort();
    const frontendPort = await reservePort();
    const output = { value: "" };

    developmentProcess = spawn(process.execPath, ["scripts/dev.js"], {
      cwd: projectRoot,
      env: {
        ...process.env,
        CACHE_DB_PATH: ":memory:",
        PORT: String(apiPort),
        VITE_DEV_SERVER_PORT: String(frontendPort),
        VITE_API_PROXY_TARGET: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    developmentProcess.stdout.on("data", (chunk) => {
      output.value += chunk;
    });
    developmentProcess.stderr.on("data", (chunk) => {
      output.value += chunk;
    });

    await waitForDemoApi(
      `http://127.0.0.1:${frontendPort}/api/subject/DEMO-1`,
      output,
    );
  }, 25_000);

  it("fails clearly instead of silently switching frontend ports", async () => {
    const apiPort = await reservePort();
    const frontendPort = await reservePort();
    const occupiedPort = net.createServer();
    await new Promise((resolve, reject) => {
      occupiedPort.once("error", reject);
      occupiedPort.listen(frontendPort, resolve);
    });
    const output = { value: "" };

    try {
      developmentProcess = spawn(process.execPath, ["scripts/dev.js"], {
        cwd: projectRoot,
        env: {
          ...process.env,
          CACHE_DB_PATH: ":memory:",
          PORT: String(apiPort),
          VITE_DEV_SERVER_PORT: String(frontendPort),
          VITE_API_PROXY_TARGET: "",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      developmentProcess.stdout.on("data", (chunk) => {
        output.value += chunk;
      });
      developmentProcess.stderr.on("data", (chunk) => {
        output.value += chunk;
      });

      const exitCode = await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () =>
            reject(
              new Error(`Development process did not exit.\n${output.value}`),
            ),
          10_000,
        );
        developmentProcess.once("exit", (code) => {
          clearTimeout(timeout);
          resolve(code);
        });
      });

      expect(exitCode).toBe(1);
      expect(output.value).toContain(`Port ${frontendPort} is already in use`);
    } finally {
      await new Promise((resolve, reject) =>
        occupiedPort.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }, 15_000);
});
