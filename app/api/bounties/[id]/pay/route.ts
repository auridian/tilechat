import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { getBountyById } from "@/features/bounties/queries";
import { createPaymentIntent } from "@/features/payments/queries";

const RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);
    const { id } = await params;

    const bounty = await getBountyById(id);
    if (!bounty) return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    if (bounty.creatorAlienId !== alienId) {
      return NextResponse.json({ error: "Only the poster can pay" }, { status: 403 });
    }
    if (bounty.status !== "claimed") {
      return NextResponse.json({ error: "Bounty must be claimed first" }, { status: 400 });
    }
    if (!bounty.rewardAmount) {
      return NextResponse.json({ error: "No reward amount set" }, { status: 400 });
    }

    const invoice = `bounty-${randomUUID()}`;
    const amountMicroUnits = String(bounty.rewardAmount * 1000);
    const tokenType = bounty.rewardToken || "USDC";

    const intent = await createPaymentIntent({
      invoice,
      senderAlienId: alienId,
      recipientAddress: RECIPIENT_ADDRESS,
      amount: amountMicroUnits,
      token: tokenType,
      network: "solana",
      productId: `bounty:${bounty.id}`,
    });

    return NextResponse.json({
      invoice: intent.invoice,
      id: intent.id,
      recipient: RECIPIENT_ADDRESS,
      amount: amountMicroUnits,
      token: tokenType,
      network: "solana",
      bountyId: bounty.id,
      item: {
        title: `Bounty: ${bounty.title}`,
        iconUrl: "https://avatars.githubusercontent.com/u/40111175?s=40&v=4",
        quantity: 1,
      },
    });
  } catch (e: any) {
    console.error("bounty pay error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
