export async function register() {
  if (process.env.RUN_MIGRATIONS === "true") {
    const { migrateDb } = await import("./lib/db");
    await migrateDb();
  }

  // Prune expired rooms/posts/sessions every 5 minutes
  const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
  setInterval(async () => {
    try {
      const { pruneExpired } = await import("./features/chat/queries");
      const result = await pruneExpired();
      if (result.rooms > 0 || result.posts > 0 || result.sessions > 0) {
        console.log("[prune]", result);
      }
    } catch (err) {
      console.error("[prune] error:", err);
    }
  }, PRUNE_INTERVAL_MS);
}
