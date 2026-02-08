import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { removeContact, updateContactNickname } from "@/features/contacts/queries";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { sub } = await verifyToken(token);
    const { id } = await params;
    const removed = await removeContact(sub, id);
    if (!removed) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { sub } = await verifyToken(token);
    const { id } = await params;
    const body = await request.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== "string") {
      return NextResponse.json({ error: "nickname is required" }, { status: 400 });
    }

    const updated = await updateContactNickname(sub, id, nickname);
    if (!updated) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    return NextResponse.json({ contact: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
