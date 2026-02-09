import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { claimBounty, completeBounty, deleteBounty, rejectBountyClaim, getBountyById, updateBounty } from "@/features/bounties/queries";
import { createNotification } from "@/features/notifications/queries";

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

      // Notify the bounty poster that someone claimed it
      await createNotification({
        recipientAlienId: bounty.creatorAlienId,
        type: "bounty_claimed",
        title: "Someone claimed your bounty",
        body: `"${bounty.title}" was claimed. Review and accept to pay, or reject.`,
        bountyId: bounty.id,
        fromAlienId: alienId,
      });

      return NextResponse.json(bounty);
    }

    if (action === "reject") {
      // Only the poster can reject a claim
      const bounty = await rejectBountyClaim(id, alienId);
      if (!bounty) return NextResponse.json({ error: "Cannot reject this claim" }, { status: 400 });

      // Notify the claimer that their claim was rejected
      if (bounty.claimedByAlienId) {
        await createNotification({
          recipientAlienId: bounty.claimedByAlienId,
          type: "bounty_rejected",
          title: "Your bounty claim was rejected",
          body: `Your claim on "${bounty.title}" was rejected. The bounty is open again.`,
          bountyId: bounty.id,
          fromAlienId: alienId,
        });
      }

      return NextResponse.json(bounty);
    }

    if (action === "complete") {
      const bounty = await completeBounty(id, alienId);
      if (!bounty) return NextResponse.json({ error: "Cannot complete this bounty" }, { status: 400 });

      // Notify the claimer that the bounty was completed (payment sent)
      if (bounty.claimedByAlienId) {
        await createNotification({
          recipientAlienId: bounty.claimedByAlienId,
          type: "bounty_completed",
          title: "Bounty payment sent!",
          body: `The poster accepted your claim on "${bounty.title}" and sent payment.`,
          bountyId: bounty.id,
          fromAlienId: alienId,
        });
      }

      return NextResponse.json(bounty);
    }

    if (action === "update") {
      const { title, description, rewardAmount, rewardToken } = await req.json();
      const bounty = await updateBounty(id, alienId, {
        title,
        description,
        rewardAmount,
        rewardToken,
      });
      if (!bounty) return NextResponse.json({ error: "Cannot update this bounty (must be open and yours)" }, { status: 400 });
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
