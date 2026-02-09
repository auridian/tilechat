import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { getUserReputation } from "@/features/reputation/queries";

export async function GET(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);

    const reputation = await getUserReputation(alienId);
    
    return NextResponse.json(reputation);
  } catch (e: any) {
    console.error("reputation GET error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
