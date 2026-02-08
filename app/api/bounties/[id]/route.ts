import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { claimBounty, completeBounty, deleteBounty } from "@/features/bounties/queries";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);
    const { id } = await params;

    const { action } = await req.json();

    if (action === "claim") {
      const bounty = await claimBounty(id, alienId);
      if (!bounty) return NextResponse.json({ error: "Cannot claim this bounty" }, { status: 400 });
      return NextResponse.json(bounty);
    }

    if (action === "complete") {
      const bounty = await completeBounty(id, alienId);
      if (!bounty) return NextResponse.json({ error: "Cannot complete this bounty" }, { status: 400 });
      return NextResponse.json(bounty);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    console.error("bounty PATCH error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);
    const { id } = await params;

    const deleted = await deleteBounty(id, alienId);
    if (!deleted) return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("bounty DELETE error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
