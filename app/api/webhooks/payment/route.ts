import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { WebhookPayload } from "@/features/payments/dto";
import {
  findPaymentIntentByInvoice,
  markPaymentIntentCompleted,
  markPaymentIntentFailed,
  createTransaction,
} from "@/features/payments/queries";

async function verifySignature(
  publicKeyHex: string,
  signatureHex: string,
  body: string,
): Promise<boolean> {
  const publicKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(publicKeyHex, "hex"),
    { name: "Ed25519" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "Ed25519",
    publicKey,
    Buffer.from(signatureHex, "hex"),
    Buffer.from(body),
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHex = request.headers.get("x-webhook-signature") ?? "";

  if (!signatureHex) {
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 401 },
    );
  }

  try {
    const isValid = await verifySignature(
      getServerEnv().WEBHOOK_PUBLIC_KEY,
      signatureHex,
      rawBody,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }

    const parsed = WebhookPayload.safeParse(JSON.parse(rawBody));

    if (!parsed.success) {
      console.error("Invalid webhook payload:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    let senderAlienId: string | null = null;

    if (payload.invoice) {
      const intent = await findPaymentIntentByInvoice(payload.invoice);

      if (intent) {
        senderAlienId = intent.senderAlienId;

        if (intent.status === "completed" || intent.status === "failed") {
          return NextResponse.json({ success: true });
        }

        if (payload.status === "finalized") {
          await markPaymentIntentCompleted(payload.invoice);
        } else if (payload.status === "failed") {
          await markPaymentIntentFailed(payload.invoice);
        }
      }
    }

    console.log("payload", payload);

    await createTransaction({
      senderAlienId,
      recipientAddress: payload.recipient,
      txHash: payload.txHash ?? null,
      status: payload.status === "finalized" ? "paid" : "failed",
      amount: payload.amount ?? null,
      token: payload.token ?? null,
      network: payload.network ?? null,
      invoice: payload.invoice ?? null,
      test: payload.test ? "true" : null,
      payload,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 400 },
    );
  }
}
