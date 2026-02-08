import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { updateUserLocation } from "@/features/nearby/queries";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);

    const body = await req.json().catch(() => ({}));
    const { lat, lon } = body;

    // Update user location if provided
    if (typeof lat === "number" && typeof lon === "number") {
      await updateUserLocation(alienId, String(lat), String(lon));
    }

    // Update session heartbeat
    await db
      .update(schema.sessions)
      .set({ lastHeartbeat: new Date() })
      .where(eq(schema.sessions.alienId, alienId));

    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (e: any) {
    console.error("heartbeat error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
