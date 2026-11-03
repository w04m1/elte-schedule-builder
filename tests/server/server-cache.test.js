import { describe, expect, it } from "vitest";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { trimCache } from "../../server/cache.js";

describe("cache bounds", () => {
  it("keeps only the newest configured entries", async () => {
    const db = await open({ filename: ":memory:", driver: sqlite3.Database });
    try {
      await db.exec(
        "CREATE TABLE cache (key TEXT PRIMARY KEY, data TEXT, timestamp INTEGER)",
      );
      await db.run("INSERT INTO cache VALUES (?, ?, ?)", "old", "data", 1);
      await db.run("INSERT INTO cache VALUES (?, ?, ?)", "middle", "data", 2);
      await db.run("INSERT INTO cache VALUES (?, ?, ?)", "new", "data", 3);

      await trimCache(db, 2);

      const rows = await db.all("SELECT key FROM cache ORDER BY timestamp");
      expect(rows).toEqual([{ key: "middle" }, { key: "new" }]);
    } finally {
      await db.close();
    }
  });
});
