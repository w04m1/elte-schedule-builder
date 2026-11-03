import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { startServer } from "../server/index.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

let backend;
let frontend;
let isClosing = false;

async function closeDevelopmentServers() {
  if (isClosing) return;
  isClosing = true;

  const results = await Promise.allSettled([
    frontend?.close(),
    backend?.close(),
  ]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
}

async function startDevelopmentServers() {
  backend = await startServer();

  try {
    frontend = await createViteServer({
      configFile: path.join(projectRoot, "config", "vite.config.js"),
    });
    await frontend.listen();
    frontend.printUrls();
  } catch (error) {
    await Promise.allSettled([frontend?.close(), backend.close()]);
    throw error;
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void closeDevelopmentServers()
      .catch((error) =>
        console.error("Failed to stop development servers", error),
      )
      .finally(() => process.exit());
  });
}

try {
  await startDevelopmentServers();
} catch (error) {
  console.error("Failed to start development servers", error);
  process.exitCode = 1;
}
