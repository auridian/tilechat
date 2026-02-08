import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { findOrCreateUser } from "@/features/user/queries";
import { findOrCreateRoom, joinRoom, getActiveSession, getRoomMemberCount } from "@/features/chat/queries";
import { updateUserLocation } from "@/features/nearby/queries";
import { computeRoomHashSync, getCurrentSlot, getSlotExpiry, latLonToTile, distanceMeters } from "@/lib/tile";
import { JwtErrors } from "@alien_org/auth-client";

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    await findOrCreateUser(sub);

    const body = await request.json();
    const { lat, lon } = body;

    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json({ error: "lat and lon are required numbers" }, { status: 400 });
    }

    const tile = latLonToTile(lat, lon);
    const slot = getCurrentSlot();
    const hash = computeRoomHashSync(tile, slot);
    const expiresTs = getSlotExpiry(slot);

    // Check roam guard: if user has an active session, ensure they haven't moved >1km in <5min
    const existingSession = await getActiveSession(sub);
    if (existingSession && existingSession.lat && existingSession.lon) {
      const dist = distanceMeters(
        parseFloat(existingSession.lat),
        parseFloat(existingSession.lon),
        lat,
        lon,
      );
      const timeSinceJoin = Date.now() - existingSession.joinedAt.getTime();
      if (dist > 1000 && timeSinceJoin < 5 * 60 * 1000) {
        return NextResponse.json(
          { error: "Roam guard: you moved too far too fast. Wait a few minutes." },
          { status: 429 },
        );
      }
    }

    const room = await findOrCreateRoom(hash, tile, slot, expiresTs);
    const session = await joinRoom(sub, hash, String(lat), String(lon));
    await updateUserLocation(sub, String(lat), String(lon));
    const memberCount = await getRoomMemberCount(hash);

    return NextResponse.json({
      hash: room.hash,
      tile,
      slot,
      expiresTs: room.expiresTs.toISOString(),
      memberCount,
      alienId: sub,
      session: {
        id: session.id,
        joinedAt: session.joinedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.error("Error in /api/chat/join:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
