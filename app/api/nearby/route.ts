import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { getNearbyUsers, updateUserLocation } from "@/features/nearby/queries";
import { getBountiesByUser } from "@/features/bounties/queries";

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);

    const { lat, lon } = await req.json();
    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
    }

    // Update caller's location
    await updateUserLocation(alienId, String(lat), String(lon));

    // Get nearby users
    const nearby = await getNearbyUsers(alienId, lat, lon);

    // Attach bounty counts for each nearby user
    const usersWithBounties = await Promise.all(
      nearby.map(async (u) => {
        const bounties = await getBountiesByUser(u.alienId);
        const openBounties = bounties.filter((b) => b.status === "open");
        return {
          ...u,
          bountyCount: openBounties.length,
          topBounty: openBounties[0]
            ? { title: openBounties[0].title, reward: openBounties[0].rewardAmount }
            : null,
        };
      }),
    );

    return NextResponse.json({ users: usersWithBounties });
  } catch (e: any) {
    console.error("nearby error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
