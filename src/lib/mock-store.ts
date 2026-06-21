import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Campaign, VisitorLog } from "@/types";
import { createUniquePublicSlug } from "@/lib/public-links";

type MockSession = Campaign;
type MockLog = VisitorLog;

interface MockDbShape {
  sessions: MockSession[];
  logs: MockLog[];
}

const mockDbPath = path.join(process.cwd(), ".mock", "db.json");

async function ensureMockDbFile() {
  await mkdir(path.dirname(mockDbPath), { recursive: true });

  try {
    await readFile(mockDbPath, "utf8");
  } catch {
    const initial: MockDbShape = { sessions: [], logs: [] };
    await writeFile(mockDbPath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readMockDb(): Promise<MockDbShape> {
  await ensureMockDbFile();
  const raw = await readFile(mockDbPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<MockDbShape>;

  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    logs: Array.isArray(parsed.logs) ? parsed.logs : [],
  };
}

async function writeMockDb(db: MockDbShape) {
  await ensureMockDbFile();
  await writeFile(mockDbPath, JSON.stringify(db, null, 2), "utf8");
}

async function ensureSessionSlugs(db: MockDbShape) {
  let changed = false;

  for (const session of db.sessions) {
    if (!session.publicSlug) {
      session.publicSlug = await createUniquePublicSlug(async (slug) =>
        db.sessions.some((entry) => entry.id !== session.id && entry.publicSlug === slug)
      );
      changed = true;
    }
  }

  if (changed) {
    await writeMockDb(db);
  }

  return db.sessions;
}

function mapSession(session: MockSession): MockSession {
  return {
    ...session,
    publicSlug: session.publicSlug || "",
  };
}

export async function getMockSessionById(sessionId: string) {
  const db = await readMockDb();
  await ensureSessionSlugs(db);
  return db.sessions.find((session) => session.id === sessionId) ?? null;
}

export async function getMockSessionBySlug(slug: string) {
  const db = await readMockDb();
  await ensureSessionSlugs(db);
  return db.sessions.find((session) => session.publicSlug === slug) ?? null;
}

export async function listMockSessions(userId: string) {
  const db = await readMockDb();
  await ensureSessionSlugs(db);
  return db.sessions
    .filter((session) => session.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(mapSession);
}

export async function createMockSession(
  userId: string,
  data: Pick<Campaign, "name" | "hostname" | "redirect">
) {
  const db = await readMockDb();
  const newSession: MockSession = {
    id: `session-${Math.random().toString(36).slice(2, 11)}`,
    userId,
    createdAt: new Date().toISOString(),
    publicSlug: await createUniquePublicSlug(async (slug) =>
      db.sessions.some((session) => session.publicSlug === slug)
    ),
    ...data,
  };

  db.sessions.push(newSession);
  await writeMockDb(db);
  return newSession;
}

export async function updateMockSession(
  sessionId: string,
  patch: Partial<
    Pick<
      Campaign,
      | "name"
      | "hostname"
      | "redirect"
      | "publicSlug"
      | "previewTitle"
      | "previewDescription"
      | "previewImage"
      | "previewSiteName"
    >
  >
) {
  const db = await readMockDb();
  const index = db.sessions.findIndex((session) => session.id === sessionId);
  if (index < 0) return null;

  db.sessions[index] = {
    ...db.sessions[index],
    ...patch,
  };
  await writeMockDb(db);
  return db.sessions[index];
}

export async function deleteMockSession(sessionId: string) {
  const db = await readMockDb();
  db.sessions = db.sessions.filter((session) => session.id !== sessionId);
  db.logs = db.logs.filter((log) => log.sessionId !== sessionId);
  await writeMockDb(db);
}

export async function listMockLogs(sessionId: string) {
  const db = await readMockDb();
  return db.logs
    .filter((log) => log.sessionId === sessionId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function createMockLog(
  sessionId: string,
  data: Pick<VisitorLog, "ip" | "rayId" | "userAgent" | "referrer"> & {
    lat?: number;
    lon?: number;
    geoAccuracy?: number;
  }
) {
  const db = await readMockDb();
  const newLog: MockLog = {
    id: `log-${Math.random().toString(36).slice(2, 11)}`,
    sessionId,
    timestamp: new Date().toISOString(),
    label: "",
    ...data,
  };

  db.logs.push(newLog);
  await writeMockDb(db);
  return newLog;
}

export async function updateMockLog(
  sessionId: string,
  logId: string,
  patch: Partial<Pick<VisitorLog, "label">>
) {
  const db = await readMockDb();
  const index = db.logs.findIndex((log) => log.sessionId === sessionId && log.id === logId);
  if (index < 0) return null;

  db.logs[index] = {
    ...db.logs[index],
    ...patch,
  };
  await writeMockDb(db);
  return db.logs[index];
}

export async function deleteMockLog(sessionId: string, logId: string) {
  const db = await readMockDb();
  db.logs = db.logs.filter((log) => !(log.sessionId === sessionId && log.id === logId));
  await writeMockDb(db);
}
