import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const DEFAULT_CACHE_DB_PATH = path.join(projectRoot, "data", "cache.db");

export async function setupDatabase(filename = DEFAULT_CACHE_DB_PATH) {
  const [{ default: sqlite3 }, { open }] = await Promise.all([
    import("sqlite3"),
    import("sqlite"),
  ]);

  if (filename !== ":memory:") {
    await mkdir(path.dirname(filename), { recursive: true });
  }
  const database = await open({
    filename,
    driver: sqlite3.Database,
  });

  await database.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // Create index on timestamp for faster cleanup queries
  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp)
  `);
  return database;
}

async function getCachedData(database, key, cacheDuration, now) {
  const entry = await database.get(
    "SELECT * FROM cache WHERE key = ? AND timestamp > ?",
    key,
    now() - cacheDuration,
  );
  return entry
    ? { data: JSON.parse(entry.data), timestamp: entry.timestamp }
    : null;
}

async function setCachedData(database, key, data, maxEntries, now) {
  await database.run(
    "INSERT OR REPLACE INTO cache (key, data, timestamp) VALUES (?, ?, ?)",
    key,
    JSON.stringify(data),
    now(),
  );
  await trimCache(database, maxEntries);
}

async function cleanupCache(database, cacheDuration, now, logger) {
  const expiredTime = now() - cacheDuration;
  const result = await database.run(
    "DELETE FROM cache WHERE timestamp < ?",
    expiredTime,
  );
  if (result.changes > 0) {
    logger.log(`Cleaned up ${result.changes} expired cache entries`);
  }
}

export async function trimCache(db, maxEntries) {
  await db.run(
    `DELETE FROM cache
     WHERE key IN (
       SELECT key FROM cache
       ORDER BY timestamp DESC, key DESC
       LIMIT -1 OFFSET ?
     )`,
    maxEntries,
  );
}

export function createSqliteCacheStore({
  database,
  cacheDuration,
  maxEntries,
  now = Date.now,
  logger = console,
}) {
  return {
    get: (key) => getCachedData(database, key, cacheDuration, now),
    set: (key, data) => setCachedData(database, key, data, maxEntries, now),
    cleanup: () => cleanupCache(database, cacheDuration, now, logger),
  };
}

export function createMemoryCacheStore({
  cacheDuration = 3 * 60 * 60 * 1000,
  maxEntries = 1000,
  now = Date.now,
  logger = console,
} = {}) {
  const entries = new Map();

  return {
    async get(key) {
      const entry = entries.get(key);
      if (!entry || entry.timestamp <= now() - cacheDuration) {
        entries.delete(key);
        return null;
      }
      return entry;
    },
    async set(key, data) {
      entries.delete(key);
      entries.set(key, { data, timestamp: now() });
      while (entries.size > maxEntries) {
        entries.delete(entries.keys().next().value);
      }
    },
    async cleanup() {
      const expiredTime = now() - cacheDuration;
      let removed = 0;
      for (const [key, entry] of entries) {
        if (entry.timestamp < expiredTime) {
          entries.delete(key);
          removed += 1;
        }
      }
      if (removed > 0)
        logger.log(`Cleaned up ${removed} expired cache entries`);
    },
  };
}
