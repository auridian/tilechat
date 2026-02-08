import { NextResponse } from "next/server";
import { pruneExpired } from "@/features/chat/queries";

export async function POST() {
  try {
    const result = await pruneExpired();
    return NextResponse.json({
      pruned: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/chat/prune:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
