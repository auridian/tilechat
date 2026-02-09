import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { createBounty, getRelevantBounties } from "@/features/bounties/queries";

export async function GET(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);

    const bounties = await getRelevantBounties(alienId);
    return NextResponse.json({ bounties });
  } catch (e: any) {
    console.error("bounties GET error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);

    const { title, description, rewardAmount, rewardToken, lat, lon } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const bounty = await createBounty(
      alienId,
      title,
      description ?? null,
      rewardAmount ?? null,
      rewardToken ?? null,
      lat ? String(lat) : null,
      lon ? String(lon) : null,
    );

    return NextResponse.json(bounty, { status: 201 });
  } catch (e: any) {
    console.error("bounties POST error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
