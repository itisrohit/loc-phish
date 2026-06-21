import { NextResponse } from "next/server";
import {
  createMockLog,
  createMockSession,
  deleteMockLog,
  deleteMockSession,
  getMockSessionById,
  getMockSessionBySlug,
  listMockLogs,
  listMockSessions,
  updateMockLog,
  updateMockSession,
} from "@/lib/mock-store";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const url = new URL(request.url);

  if (path[0] === "sessions" && path.length === 1) {
    const userId = url.searchParams.get("userId");
    if (!userId) return json({ error: "Missing userId" }, 400);
    return json(await listMockSessions(userId));
  }

  if (path[0] === "sessions" && path[1] === "slug" && path[2]) {
    const session = await getMockSessionBySlug(path[2]);
    return session ? json(session) : json({ error: "Not found" }, 404);
  }

  if (path[0] === "sessions" && path[1] && path.length === 2) {
    const session = await getMockSessionById(path[1]);
    return session ? json(session) : json({ error: "Not found" }, 404);
  }

  if (path[0] === "sessions" && path[1] && path[2] === "logs") {
    return json(await listMockLogs(path[1]));
  }

  return json({ error: "Not found" }, 404);
}

export async function POST(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const payload = (await request.json()) as Record<string, unknown>;

  if (path[0] === "sessions" && path.length === 1) {
    const userId = String(payload.userId ?? "");
    if (!userId) return json({ error: "Missing userId" }, 400);

    const session = await createMockSession(userId, {
      name: String(payload.name ?? ""),
      hostname: String(payload.hostname ?? ""),
      redirect: String(payload.redirect ?? ""),
    });
    return json(session, 201);
  }

  if (path[0] === "sessions" && path[1] && path[2] === "logs") {
    const log = await createMockLog(path[1], {
      ip: String(payload.ip ?? ""),
      rayId: String(payload.rayId ?? ""),
      userAgent: String(payload.userAgent ?? ""),
      referrer: String(payload.referrer ?? ""),
    });
    return json(log, 201);
  }

  return json({ error: "Not found" }, 404);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const payload = (await request.json()) as Record<string, unknown>;

  if (path[0] === "sessions" && path[1] && path.length === 2) {
    const session = await updateMockSession(path[1], {
      name: payload.name ? String(payload.name) : undefined,
      hostname: payload.hostname ? String(payload.hostname) : undefined,
      redirect: payload.redirect ? String(payload.redirect) : undefined,
      publicSlug: payload.publicSlug ? String(payload.publicSlug) : undefined,
      previewTitle: payload.previewTitle ? String(payload.previewTitle) : undefined,
      previewDescription: payload.previewDescription
        ? String(payload.previewDescription)
        : undefined,
      previewImage: payload.previewImage ? String(payload.previewImage) : undefined,
      previewSiteName: payload.previewSiteName ? String(payload.previewSiteName) : undefined,
    });
    return session ? json(session) : json({ error: "Not found" }, 404);
  }

  if (path[0] === "sessions" && path[1] && path[2] === "logs" && path[3]) {
    const log = await updateMockLog(path[1], path[3], {
      label: payload.label !== undefined ? String(payload.label) : undefined,
      lat: payload.lat !== undefined ? Number(payload.lat) : undefined,
      lon: payload.lon !== undefined ? Number(payload.lon) : undefined,
      geoAccuracy: payload.geoAccuracy !== undefined ? Number(payload.geoAccuracy) : undefined,
    });
    return log ? json(log) : json({ error: "Not found" }, 404);
  }

  return json({ error: "Not found" }, 404);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { path = [] } = await context.params;

  if (path[0] === "sessions" && path[1] && path.length === 2) {
    await deleteMockSession(path[1]);
    return new NextResponse(null, { status: 204 });
  }

  if (path[0] === "sessions" && path[1] && path[2] === "logs" && path[3]) {
    await deleteMockLog(path[1], path[3]);
    return new NextResponse(null, { status: 204 });
  }

  return json({ error: "Not found" }, 404);
}
