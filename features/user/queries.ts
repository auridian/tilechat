import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";

export async function findOrCreateUser(alienId: string): Promise<User> {
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.alienId, alienId),
  });

  if (existing) {
    const [updated] = await db
      .update(schema.users)
      .set({ updatedAt: new Date() })
      .where(eq(schema.users.id, existing.id))
      .returning();
    return updated;
  }

  try {
    const [created] = await db
      .insert(schema.users)
      .values({ alienId })
      .returning();
    return created;
  } catch {
    // Unique constraint race: another request created the user first
    const retry = await db.query.users.findFirst({
      where: eq(schema.users.alienId, alienId),
    });
    if (retry) return retry;
    throw new Error("Failed to find or create user");
  }
}
