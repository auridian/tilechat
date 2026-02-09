import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Notification } from "@/lib/db/schema";

export async function createNotification(data: {
  recipientAlienId: string;
  type: string;
  title: string;
  body?: string | null;
  bountyId?: string | null;
  fromAlienId?: string | null;
}): Promise<Notification> {
  const [notif] = await db
    .insert(schema.notifications)
    .values({
      recipientAlienId: data.recipientAlienId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      bountyId: data.bountyId ?? null,
      fromAlienId: data.fromAlienId ?? null,
    })
    .returning();
  return notif;
}

export async function getNotifications(
  alienId: string,
  limit = 50,
): Promise<Notification[]> {
  return db.query.notifications.findMany({
    where: eq(schema.notifications.recipientAlienId, alienId),
    orderBy: [desc(schema.notifications.createdAt)],
    limit,
  });
}

export async function markNotificationRead(
  notifId: string,
  alienId: string,
): Promise<boolean> {
  const result = await db
    .update(schema.notifications)
    .set({ read: "true" })
    .where(
      and(
        eq(schema.notifications.id, notifId),
        eq(schema.notifications.recipientAlienId, alienId),
      ),
    )
    .returning();
  return result.length > 0;
}

export async function getUnreadCount(alienId: string): Promise<number> {
  const unread = await db.query.notifications.findMany({
    where: and(
      eq(schema.notifications.recipientAlienId, alienId),
      eq(schema.notifications.read, "false"),
    ),
  });
  return unread.length;
}
