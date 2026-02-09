import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { castVote, getUserReputation } from "@/features/reputation/queries";

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: voterAlienId } = await verifyToken(token);

    const { postId, authorAlienId, direction } = await req.json();
    
    if (!postId || !authorAlienId || !direction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    if (voterAlienId === authorAlienId) {
      return NextResponse.json({ error: "Cannot vote on your own message" }, { status: 400 });
    }

    // Get voter's reputation for weight calculation
    const reputation = await getUserReputation(voterAlienId);

    const result = await castVote(
      postId,
      voterAlienId,
      authorAlienId,
      direction,
      reputation.voteWeight
    );

    return NextResponse.json({ 
      success: result.success,
      changed: result.changed,
      voterWeight: reputation.voteWeight,
    });
  } catch (e: any) {
    console.error("vote POST error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
