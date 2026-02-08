import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { findOrCreateUser } from "@/features/user/queries";

const DEV_ALIEN_ID = "dev-user-local-test";

export async function POST() {
  try {
    const { NODE_ENV } = getServerEnv();

    if (NODE_ENV !== "development") {
      return NextResponse.json({ error: "Dev auth only available in development" }, { status: 403 });
    }

    const user = await findOrCreateUser(DEV_ALIEN_ID);

    return NextResponse.json({
      token: `dev:${DEV_ALIEN_ID}`,
      alienId: DEV_ALIEN_ID,
      user: {
        id: user.id,
        alienId: user.alienId,
      },
    });
  } catch (error) {
    console.error("Error in /api/dev/auth:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
