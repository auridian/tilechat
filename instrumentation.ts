export async function register() {
  if (process.env.RUN_MIGRATIONS === "true") {
    try {
      const { migrateDb } = await import("./lib/db");
      await migrateDb();
    } catch (err) {
      console.error("[migrations] Failed to run migrations:", err);
      console.error("[migrations] The app will start but DB may not be ready.");
    }
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
