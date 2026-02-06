import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";

export async function findOrCreateUser(alienId: string): Promise<User> {
  if (!alienId) {
    throw new Error("alienId is required");
  }

  let user = await db.query.users.findFirst({
    where: eq(schema.users.alienId, alienId),
  });

  if (!user) {
    const [newUser] = await db
      .insert(schema.users)
      .values({ alienId })
      .returning();

    if (!newUser) {
      throw new Error("Failed to create user");
    }

    user = newUser;
  } else {
    await db
      .update(schema.users)
      .set({ updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
  }

  return user;
}
