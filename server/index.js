import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPositiveInteger, readPort } from "../config/runtime.js";
import { createSubjectRateLimiter } from "./rate-limit.js";
import { QueueCapacityError, SubjectRequestQueue } from "./subject-queue.js";
import {
  fetchSubjectData,
  getCurrentTerm,
  validateSubjectSearch,
} from "./tanrend.js";
import {
  createSqliteCacheStore,
  DEFAULT_CACHE_DB_PATH,
  setupDatabase,
} from "./cache.js";
import { generateDemoData } from "./demo-data.js";
import { createSecurityHeaders } from "./security-headers.js";
import { createServerLogger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const port = readPort(process.env.PORT, 3000, "PORT");

const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const REQUEST_DELAY = 500; // 500ms between upstream requests

function createSubjectHandler({
  cache,
  subjectRequestQueue,
  termProvider,
  logger,
}) {
  return async (req, res) => {
    try {
      const term = termProvider();
      const searchTerm = req.params.query.trim();
      const searchMode = req.subjectSearchMode;
      const cacheKey = `${term}-${searchMode}-${searchTerm}`;
      const demoData =
        searchMode === "code" ? generateDemoData(searchTerm) : null;

      if (demoData) {
        logger.log(`Returning demo data for ${searchTerm}`);
        return res.send(demoData);
      }

      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.log(`Cache hit for ${searchMode} search ${searchTerm}`);
        return res.send(cachedData.data);
      }

      logger.log(`Cache miss for ${searchMode} search ${searchTerm}`);
      const data = await subjectRequestQueue.enqueue(
        searchTerm,
        term,
        searchMode,
      );
      return res.send(data);
    } catch (error) {
      logger.error(
        `Error fetching data for subject search ${req.params.query}:`,
        error,
      );
      if (error instanceof QueueCapacityError) {
        res.set("Retry-After", "1");
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(error.response?.status || 500).json({
        error: "Failed to fetch subject data",
      });
    }
  };
}

function createSpaHandler(staticRoot) {
  return (req, res, next) => {
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(req.path);
    } catch {
      return res.sendStatus(404);
    }

    const pathSegments = decodedPath.split("/").filter(Boolean);
    const isUnsafeOrFileLike =
      decodedPath.includes("%") ||
      decodedPath.includes("\\") ||
      decodedPath === "/api" ||
      decodedPath.startsWith("/api/") ||
      pathSegments.some((segment) => segment.startsWith(".")) ||
      path.posix.extname(decodedPath) !== "";

    if (isUnsafeOrFileLike || !req.accepts("html")) {
      return res.sendStatus(404);
    }

    return res.sendFile(
      "index.html",
      { root: staticRoot, dotfiles: "deny" },
      (error) => {
        if (error) next(error);
      },
    );
  };
}

export function createApp({
  database,
  cacheStore,
  fetchSubject = fetchSubjectData,
  termProvider = getCurrentTerm,
  cacheDuration = CACHE_DURATION,
  maxCacheEntries = readPositiveInteger(process.env.MAX_CACHE_ENTRIES, 1000),
  requestDelay = REQUEST_DELAY,
  maxQueueLength = readPositiveInteger(process.env.MAX_QUEUE_LENGTH, 100),
  subjectRateLimit = readPositiveInteger(process.env.SUBJECT_RATE_LIMIT, 60),
  now = Date.now,
  staticDirectory = path.join(projectRoot, "dist"),
  trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS, 10),
  logger = createServerLogger(),
} = {}) {
  if (!database && !cacheStore) {
    throw new TypeError("createApp requires a database or cache store");
  }

  const app = express();
  const staticRoot = path.resolve(staticDirectory);
  const cache =
    cacheStore ??
    createSqliteCacheStore({
      database,
      cacheDuration,
      maxEntries: maxCacheEntries,
      now,
      logger,
    });
  const subjectRequestQueue = new SubjectRequestQueue({
    delay: requestDelay,
    maxQueued: maxQueueLength,
    handler: async (searchTerm, term, searchMode) => {
      logger.log(`Processing queued ${searchMode} search for ${searchTerm}`);
      const data =
        searchMode === "code"
          ? await fetchSubject(searchTerm, term)
          : await fetchSubject(searchTerm, term, searchMode);
      await cache.set(`${term}-${searchMode}-${searchTerm}`, data);
      return data;
    },
  });

  app.use(createSecurityHeaders());
  // The browser and API intentionally share one origin. Vite preserves that
  // contract in development by proxying /api to this server.
  if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
    app.set("trust proxy", trustProxyHops);
  }
  app.use(
    "/api/subject",
    createSubjectRateLimiter({
      windowMs: 60 * 1000,
      limit: subjectRateLimit,
    }),
  );
  app.use(
    express.static(staticRoot, {
      dotfiles: "deny",
      fallthrough: true,
      index: false,
      redirect: false,
    }),
  );

  app.get(
    "/api/subject/:query",
    validateSubjectSearch,
    createSubjectHandler({ cache, subjectRequestQueue, termProvider, logger }),
  );

  app.get("/{*path}", createSpaHandler(staticRoot));

  return {
    app,
    cleanupCache: () => cache.cleanup(),
  };
}

export async function startServer({
  listenPort = port,
  databaseFilename = process.env.CACHE_DB_PATH || DEFAULT_CACHE_DB_PATH,
  logger = createServerLogger(),
} = {}) {
  const database = await setupDatabase(databaseFilename);
  const { app, cleanupCache: cleanup } = createApp({ database, logger });
  const cacheCleanupInterval = setInterval(cleanup, 60 * 60 * 1000);
  const server = app.listen(listenPort, () => {
    logger.info?.(`Server running at http://localhost:${listenPort}`);
  });

  return {
    app,
    database,
    server,
    async close() {
      clearInterval(cacheCleanupInterval);
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      await database.close();
    },
  };
}

let defaultRuntime;
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  defaultRuntime = await startServer();
}

export async function closeServer() {
  await defaultRuntime?.close();
  defaultRuntime = undefined;
}
