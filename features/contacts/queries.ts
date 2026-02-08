import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getContacts(ownerAlienId: string) {
  return db.query.contacts.findMany({
    where: eq(schema.contacts.ownerAlienId, ownerAlienId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function addContact(
  ownerAlienId: string,
  contactAlienId: string,
  nickname?: string,
) {
  const existing = await db.query.contacts.findFirst({
    where: and(
      eq(schema.contacts.ownerAlienId, ownerAlienId),
      eq(schema.contacts.contactAlienId, contactAlienId),
    ),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(schema.contacts)
    .values({ ownerAlienId, contactAlienId, nickname })
    .returning();
  return created;
}

export async function removeContact(ownerAlienId: string, contactId: string) {
  const result = await db
    .delete(schema.contacts)
    .where(
      and(
        eq(schema.contacts.id, contactId),
        eq(schema.contacts.ownerAlienId, ownerAlienId),
      ),
    )
    .returning();
  return result.length > 0;
}

export async function updateContactNickname(
  ownerAlienId: string,
  contactId: string,
  nickname: string,
) {
  const [updated] = await db
    .update(schema.contacts)
    .set({ nickname })
    .where(
      and(
        eq(schema.contacts.id, contactId),
        eq(schema.contacts.ownerAlienId, ownerAlienId),
      ),
    )
    .returning();
  return updated ?? null;
}
