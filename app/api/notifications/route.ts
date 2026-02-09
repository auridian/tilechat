import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { getNotifications, getUnreadCount } from "@/features/notifications/queries";

export async function GET(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sub: alienId } = await verifyToken(token);

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(alienId),
      getUnreadCount(alienId),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (e: any) {
    console.error("notifications GET error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
