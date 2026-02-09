import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { getRecentPosts, getRoomMemberCount } from "@/features/chat/queries";
import { getVotesForPosts } from "@/features/reputation/queries";
import { JwtErrors } from "@alien_org/auth-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub: alienId } = await verifyToken(token);

    const { hash } = await params;

    if (!hash) {
      return NextResponse.json({ error: "hash param is required" }, { status: 400 });
    }

    const posts = await getRecentPosts(hash, 50);
    const memberCount = await getRoomMemberCount(hash);

    // Get vote counts for all posts
    const postIds = posts.map(p => p.id);
    const votes = await getVotesForPosts(postIds, alienId);

    return NextResponse.json({
      hash,
      memberCount,
      posts: posts.reverse().map((p) => ({
        id: p.id,
        alienId: p.alienId,
        body: p.body,
        ts: p.ts.toISOString(),
        votes: votes[p.id] || { up: 0, down: 0, score: 0, userVote: null },
      })),
    });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.error("Error in /api/chat/history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
