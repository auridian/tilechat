import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { CreateInvoiceRequest } from "@/features/payments/dto";
import { createPaymentIntent } from "@/features/payments/queries";

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 },
      );
    }

    const { sub } = await verifyToken(token);

    const body = await request.json();
    const parsed = CreateInvoiceRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { recipientAddress, amount, token: paymentToken, network, productId } = parsed.data;
    const invoice = `inv-${randomUUID()}`;

    const intent = await createPaymentIntent({
      invoice,
      senderAlienId: sub,
      recipientAddress,
      amount,
      token: paymentToken,
      network,
      productId,
    });

    return NextResponse.json({
      invoice: intent.invoice,
      id: intent.id,
    });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.error("Failed to create invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
