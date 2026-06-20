import { initializeApp, getApps } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Campaign } from "@/types";
import { getMockSessionById, getMockSessionBySlug, updateMockSession } from "@/lib/mock-store";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isServerFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "";

function getServerDb() {
  if (!isServerFirebaseConfigured) return null;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getFirestore(app);
}

function mapSession(
  sessionId: string,
  data: Record<string, unknown>
): Campaign {
  return {
    id: sessionId,
    name: String(data.name ?? ""),
    hostname: String(data.hostname ?? ""),
    redirect: String(data.redirect ?? ""),
    userId: String(data.userId ?? ""),
    createdAt: String(data.createdAt ?? ""),
    publicSlug: String(data.publicSlug ?? ""),
    previewTitle: data.previewTitle ? String(data.previewTitle) : undefined,
    previewDescription: data.previewDescription ? String(data.previewDescription) : undefined,
    previewImage: data.previewImage ? String(data.previewImage) : undefined,
    previewSiteName: data.previewSiteName ? String(data.previewSiteName) : undefined,
  };
}

export async function getServerSessionBySlug(slug: string) {
  if (!isServerFirebaseConfigured) {
    return getMockSessionBySlug(slug);
  }

  const db = getServerDb();
  if (!db || !slug) return null;

  const sessionQuery = query(
    collection(db, "sessions"),
    where("publicSlug", "==", slug),
    limit(1)
  );
  const snapshot = await getDocs(sessionQuery);
  const match = snapshot.docs[0];

  if (!match) return null;

  return mapSession(match.id, match.data() as Record<string, unknown>);
}

export async function getServerSessionById(sessionId: string) {
  if (!isServerFirebaseConfigured) {
    return getMockSessionById(sessionId);
  }

  const db = getServerDb();
  if (!db || !sessionId) return null;

  const sessionRef = doc(db, "sessions", sessionId);
  const snapshot = await getDoc(sessionRef);
  if (!snapshot.exists()) return null;

  return mapSession(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function updateServerSessionPreview(
  sessionId: string,
  preview: Pick<Campaign, "previewTitle" | "previewDescription" | "previewImage" | "previewSiteName">
) {
  if (!isServerFirebaseConfigured) {
    await updateMockSession(sessionId, preview);
    return;
  }

  const db = getServerDb();
  if (!db || !sessionId) return;

  try {
    await updateDoc(doc(db, "sessions", sessionId), preview);
  } catch (error) {
    console.error("Failed to update session preview metadata:", error);
  }
}
