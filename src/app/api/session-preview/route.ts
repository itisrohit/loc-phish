import { NextResponse } from "next/server";
import { getServerSessionById, updateServerSessionPreview } from "@/lib/firebase-server";
import { fetchTargetPreview } from "@/lib/target-preview";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { sessionId?: string };
    const sessionId = payload.sessionId?.trim() || "";

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await getServerSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const preview = await fetchTargetPreview(session.redirect);
    if (!preview) {
      return NextResponse.json({ error: "No preview metadata available" }, { status: 422 });
    }

    await updateServerSessionPreview(sessionId, preview);
    return NextResponse.json(preview);
  } catch (error) {
    console.error("Failed to build session preview metadata:", error);
    return NextResponse.json({ error: "Failed to build preview metadata" }, { status: 500 });
  }
}
