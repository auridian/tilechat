import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { findOrCreateUser } from "@/features/user/queries";
import { getSessionForRoom, createPost, updateLastPostAt } from "@/features/chat/queries";
import { JwtErrors } from "@alien_org/auth-client";

const MAX_BODY_LENGTH = 280;
const COOLDOWN_MS = 90 * 1000; // 90 seconds

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    await findOrCreateUser(sub);

    const body = await request.json();
    const { hash, message } = body;

    if (!hash || typeof hash !== "string") {
      return NextResponse.json({ error: "hash is required" }, { status: 400 });
    }
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (message.length > MAX_BODY_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_BODY_LENGTH} chars)` },
        { status: 400 },
      );
    }

    const session = await getSessionForRoom(sub, hash);
    if (!session) {
      return NextResponse.json(
        { error: "You must join this room before posting" },
        { status: 403 },
      );
    }

    // Cooldown check
    if (session.lastPostAt) {
      const elapsed = Date.now() - session.lastPostAt.getTime();
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Cooldown active. Wait ${remaining}s before posting again.`, remaining },
          { status: 429 },
        );
      }
    }

    const post = await createPost(hash, sub, message.trim());
    await updateLastPostAt(sub, hash);

    return NextResponse.json({
      id: post.id,
      hash: post.hash,
      alienId: post.alienId,
      body: post.body,
      ts: post.ts.toISOString(),
    });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.error("Error in /api/chat/post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
