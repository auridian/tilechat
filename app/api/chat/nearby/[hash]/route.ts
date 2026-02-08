import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { getAliveRoomsByHashes } from "@/features/chat/queries";
import { getNeighborTiles, getCurrentSlot, computeRoomHashSync } from "@/lib/tile";
import { JwtErrors } from "@alien_org/auth-client";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    await verifyToken(token);

    const { hash } = await params;

    if (!hash) {
      return NextResponse.json({ error: "hash param is required" }, { status: 400 });
    }

    const room = await db.query.rooms.findFirst({
      where: eq(schema.rooms.hash, hash),
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const neighborTiles = getNeighborTiles(room.tile);
    const slot = getCurrentSlot();
    const neighborHashes = neighborTiles.map((t) => computeRoomHashSync(t, slot));

    const aliveRooms = await getAliveRoomsByHashes(neighborHashes);

    return NextResponse.json({
      neighbors: aliveRooms.map((r) => ({
        hash: r.hash,
        tile: r.tile,
        expiresTs: r.expiresTs.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.error("Error in /api/chat/nearby:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
