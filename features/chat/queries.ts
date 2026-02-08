import { eq, and, lt, desc, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Room, Post, Session } from "@/lib/db/schema";

export async function findOrCreateRoom(
  hash: string,
  tile: string,
  slot: string,
  expiresTs: Date,
): Promise<Room> {
  const existing = await db.query.rooms.findFirst({
    where: eq(schema.rooms.hash, hash),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(schema.rooms)
    .values({ hash, tile, slot, expiresTs })
    .onConflictDoNothing()
    .returning();

  return created ?? (await db.query.rooms.findFirst({
    where: eq(schema.rooms.hash, hash),
  }))!;
}

export async function getRecentPosts(hash: string, limit = 50): Promise<Post[]> {
  return db.query.posts.findMany({
    where: eq(schema.posts.hash, hash),
    orderBy: [desc(schema.posts.ts)],
    limit,
  });
}

export async function createPost(
  hash: string,
  alienId: string,
  body: string,
): Promise<Post> {
  const [post] = await db
    .insert(schema.posts)
    .values({ hash, alienId, body })
    .returning();
  return post;
}

export async function getActiveSession(
  alienId: string,
): Promise<Session | undefined> {
  return db.query.sessions.findFirst({
    where: eq(schema.sessions.alienId, alienId),
  });
}

export async function joinRoom(
  alienId: string,
  hash: string,
  lat: string,
  lon: string,
): Promise<Session> {
  await db
    .delete(schema.sessions)
    .where(eq(schema.sessions.alienId, alienId));

  const [session] = await db
    .insert(schema.sessions)
    .values({ alienId, hash, lat, lon })
    .returning();
  return session;
}

export async function leaveRoom(alienId: string): Promise<void> {
  await db
    .delete(schema.sessions)
    .where(eq(schema.sessions.alienId, alienId));
}

export async function updateLastPostAt(
  alienId: string,
  hash: string,
): Promise<void> {
  await db
    .update(schema.sessions)
    .set({ lastPostAt: new Date() })
    .where(
      and(
        eq(schema.sessions.alienId, alienId),
        eq(schema.sessions.hash, hash),
      ),
    );
}

export async function getSessionForRoom(
  alienId: string,
  hash: string,
): Promise<Session | undefined> {
  return db.query.sessions.findFirst({
    where: and(
      eq(schema.sessions.alienId, alienId),
      eq(schema.sessions.hash, hash),
    ),
  });
}

export async function getRoomMemberCount(hash: string): Promise<number> {
  const members = await db.query.sessions.findMany({
    where: eq(schema.sessions.hash, hash),
  });
  return members.length;
}

export async function getAliveRoomsByHashes(
  hashes: string[],
): Promise<Room[]> {
  if (hashes.length === 0) return [];
  return db.query.rooms.findMany({
    where: and(
      inArray(schema.rooms.hash, hashes),
      // not yet expired
    ),
  });
}

export async function pruneExpired(): Promise<{ rooms: number; posts: number; sessions: number }> {
  const now = new Date();

  const expiredRooms = await db.query.rooms.findMany({
    where: lt(schema.rooms.expiresTs, now),
  });

  if (expiredRooms.length === 0) {
    return { rooms: 0, posts: 0, sessions: 0 };
  }

  const expiredHashes = expiredRooms.map((r) => r.hash);

  const deletedPosts = await db
    .delete(schema.posts)
    .where(inArray(schema.posts.hash, expiredHashes))
    .returning();

  const deletedSessions = await db
    .delete(schema.sessions)
    .where(inArray(schema.sessions.hash, expiredHashes))
    .returning();

  const deletedRooms = await db
    .delete(schema.rooms)
    .where(inArray(schema.rooms.hash, expiredHashes))
    .returning();

  return {
    rooms: deletedRooms.length,
    posts: deletedPosts.length,
    sessions: deletedSessions.length,
  };
}
