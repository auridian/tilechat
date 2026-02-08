import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { getContacts, addContact } from "@/features/contacts/queries";

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { sub } = await verifyToken(token);
    const contacts = await getContacts(sub);
    return NextResponse.json({ contacts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { sub } = await verifyToken(token);
    const body = await request.json();
    const { contactAlienId, nickname } = body;

    if (!contactAlienId || typeof contactAlienId !== "string") {
      return NextResponse.json({ error: "contactAlienId is required" }, { status: 400 });
    }
    if (contactAlienId === sub) {
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
    }

    const contact = await addContact(sub, contactAlienId, nickname);
    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
