import { eq, and, ne, gte, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const NEARBY_THRESHOLD_MS = 15 * 60 * 1000; // users seen in last 15 min

export async function updateUserLocation(
  alienId: string,
  lat: string,
  lon: string,
) {
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.alienId, alienId),
  });

  if (existing) {
    await db
      .update(schema.users)
      .set({
        lastLat: lat,
        lastLon: lon,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.alienId, alienId));
  } else {
    await db
      .insert(schema.users)
      .values({
        alienId,
        lastLat: lat,
        lastLon: lon,
        lastSeenAt: new Date(),
      })
      .onConflictDoNothing();
  }
}

export async function getNearbyUsers(
  alienId: string,
  lat: number,
  lon: number,
  radiusMeters: number = 2000,
) {
  const cutoff = new Date(Date.now() - NEARBY_THRESHOLD_MS);

  const allUsers = await db.query.users.findMany({
    where: and(
      ne(schema.users.alienId, alienId),
      gte(schema.users.lastSeenAt, cutoff),
    ),
  });

  // Calculate distance and filter by radius, then fuzz for privacy
  const withDistance = allUsers
    .filter((u) => u.lastLat && u.lastLon)
    .map((u) => {
      const uLat = parseFloat(u.lastLat!);
      const uLon = parseFloat(u.lastLon!);
      const dist = haversineMeters(lat, lon, uLat, uLon);
      // Fuzz distance by +/- 15% for privacy
      const fuzzFactor = 0.85 + Math.random() * 0.3;
      const fuzzedDist = Math.round(dist * fuzzFactor);
      return {
        alienId: u.alienId,
        bio: u.bio,
        distanceMeters: fuzzedDist,
        lastSeenAt: u.lastSeenAt,
      };
    })
    .filter((u) => u.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return withDistance;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
