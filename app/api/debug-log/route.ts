import { NextResponse } from "next/server";

const recentLogs: { time: string; logs: unknown[] }[] = [];
const MAX_LOGS = 50;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    recentLogs.push({ time: new Date().toISOString(), logs: body.logs ?? [] });
    if (recentLogs.length > MAX_LOGS) recentLogs.shift();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ logs: recentLogs });
}
