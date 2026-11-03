import { createApp } from "../../server/index.js";
import { createMemoryCacheStore } from "../../server/cache.js";

const cacheStore = createMemoryCacheStore();
const { app } = createApp({ cacheStore, trustProxyHops: 1 });

/**
 * Vercel adapter for the existing Express application. Warm function instances
 * reuse the bounded in-memory cache; local and container deployments use SQLite.
 */
export default function handler(request, response) {
  return app(request, response);
}
