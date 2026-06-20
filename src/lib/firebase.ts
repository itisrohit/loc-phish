import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import type { Campaign, VisitorLog } from "@/types";
import { createUniquePublicSlug } from "@/lib/public-links";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isFirebaseConfigured =
  typeof window !== "undefined" && !!firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "";

let app: ReturnType<typeof initializeApp> | null = null;
let realAuth: ReturnType<typeof getAuth> | null = null;
let realDb: ReturnType<typeof getFirestore> | null = null;

if (isFirebaseConfigured && typeof window !== "undefined") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    realAuth = getAuth(app);
    realDb = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Simple user shape used across mock and real auth
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

type AuthCallback = (user: AuthUser | null) => void;

// ==========================================
// UNIFIED AUTH INTERFACE
// ==========================================
export const auth = {
  isMock: !isFirebaseConfigured,

  loginWithGoogle: async (): Promise<AuthUser> => {
    if (isFirebaseConfigured && realAuth) {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(realAuth, provider);
      const u = userCredential.user;
      return { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL };
    } else {
      const mockGoogleUser: AuthUser = {
        uid: "mock-google-uid-12345",
        email: "developer@gmail.com",
        displayName: "Developer User",
        photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      };
      localStorage.setItem("mock_current_user", JSON.stringify(mockGoogleUser));
      triggerMockAuthStateChange(mockGoogleUser);
      return mockGoogleUser;
    }
  },

  logout: async () => {
    if (isFirebaseConfigured && realAuth) {
      await signOut(realAuth);
    } else {
      localStorage.removeItem("mock_current_user");
      triggerMockAuthStateChange(null);
    }
  },

  onAuthStateChanged: (callback: AuthCallback) => {
    if (isFirebaseConfigured && realAuth) {
      const unsubscribe = onAuthStateChanged(realAuth, (firebaseUser) => {
        if (firebaseUser) {
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } else {
          callback(null);
        }
      });
      return unsubscribe;
    } else {
      mockAuthListeners.push(callback);
      const raw = localStorage.getItem("mock_current_user");
      const user: AuthUser | null = raw ? JSON.parse(raw) : null;
      setTimeout(() => callback(user), 0);
      return () => {
        const index = mockAuthListeners.indexOf(callback);
        if (index > -1) mockAuthListeners.splice(index, 1);
      };
    }
  },

  getCurrentUser: (): AuthUser | null => {
    if (isFirebaseConfigured && realAuth) {
      const u = realAuth.currentUser;
      if (!u) return null;
      return { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL };
    } else {
      const raw = localStorage.getItem("mock_current_user");
      return raw ? JSON.parse(raw) : null;
    }
  },
};

const mockAuthListeners: AuthCallback[] = [];
function triggerMockAuthStateChange(user: AuthUser | null) {
  mockAuthListeners.forEach((cb) => cb(user));
}

async function requestMock<T>(input: string, init?: RequestInit) {
  const response = await fetch(`/api/mock/${input}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || `Mock request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function slugExistsInFirestore(slug: string) {
  if (!realDb) return false;
  const slugQuery = query(collection(realDb, "sessions"), where("publicSlug", "==", slug), limit(1));
  const snapshot = await getDocs(slugQuery);
  return !snapshot.empty;
}

async function ensureFirestoreSessionSlug(sessionId: string, data: Record<string, unknown>) {
  const currentSlug = typeof data.publicSlug === "string" ? data.publicSlug.trim() : "";
  if (currentSlug) return currentSlug;
  if (!realDb) return "";

  const publicSlug = await createUniquePublicSlug(slugExistsInFirestore);
  await updateDoc(doc(realDb, "sessions", sessionId), { publicSlug });
  data.publicSlug = publicSlug;
  return publicSlug;
}

function mapCampaign(sessionId: string, data: Record<string, unknown>): Campaign {
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

// ==========================================
// UNIFIED DATABASE INTERFACE
// ==========================================
export const db = {
  getSession: async (sessionId: string) => {
    if (isFirebaseConfigured && realDb) {
      const docRef = doc(realDb, "sessions", sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, unknown>;
        await ensureFirestoreSessionSlug(docSnap.id, data);
        return { id: docSnap.id, ...data };
      }
      return null;
    } else {
      return requestMock<Campaign | null>(`sessions/${sessionId}`);
    }
  },

  getSessionBySlug: async (publicSlug: string) => {
    if (isFirebaseConfigured && realDb) {
      const q = query(collection(realDb, "sessions"), where("publicSlug", "==", publicSlug));
      const querySnapshot = await getDocs(q);
      const match = querySnapshot.docs[0];
      if (!match) return null;
      return { id: match.id, ...match.data() };
    } else {
      return requestMock<Campaign | null>(`sessions/slug/${publicSlug}`);
    }
  },

  createSession: async (
    userId: string,
    sessionData: { name: string; hostname: string; redirect: string }
  ) => {
    if (isFirebaseConfigured && realDb) {
      const data = {
        ...sessionData,
        userId,
        createdAt: new Date().toISOString(),
        publicSlug: await createUniquePublicSlug(slugExistsInFirestore),
      };
      const docRef = await addDoc(collection(realDb, "sessions"), data);
      return { id: docRef.id, ...data };
    } else {
      return requestMock<Campaign>("sessions", {
        method: "POST",
        body: JSON.stringify({
          userId,
          ...sessionData,
        }),
      });
    }
  },

  getSessions: async (userId: string) => {
    if (isFirebaseConfigured && realDb) {
      const q = query(
        collection(realDb, "sessions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const result: Campaign[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        result.push(mapCampaign(d.id, data));
      });
      await Promise.all(
        result
          .filter((session) => !session.publicSlug)
          .map(async (session) => {
            session.publicSlug = await createUniquePublicSlug(slugExistsInFirestore);
            await updateDoc(doc(realDb, "sessions", session.id), { publicSlug: session.publicSlug });
          })
      );
      return result;
    } else {
      return requestMock<Campaign[]>(`sessions?userId=${encodeURIComponent(userId)}`);
    }
  },

  deleteSession: async (sessionId: string) => {
    if (isFirebaseConfigured && realDb) {
      await deleteDoc(doc(realDb, "sessions", sessionId));
    } else {
      await requestMock(`sessions/${sessionId}`, { method: "DELETE" });
    }
  },

  logVisit: async (
    sessionId: string,
    logData: {
      ip: string;
      rayId: string;
      userAgent: string;
      referrer: string;
    }
  ) => {
    const data = {
      ...logData,
      timestamp: new Date().toISOString(),
    };

    if (isFirebaseConfigured && realDb) {
      await addDoc(collection(realDb, `sessions/${sessionId}/logs`), data);
    } else {
      await requestMock(`sessions/${sessionId}/logs`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
  },

  getLogs: async (sessionId: string) => {
    if (isFirebaseConfigured && realDb) {
      const q = query(
        collection(realDb, `sessions/${sessionId}/logs`),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const result: VisitorLog[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        result.push({
          id: d.id,
          sessionId,
          ip: String(data.ip ?? ""),
          rayId: String(data.rayId ?? ""),
          userAgent: String(data.userAgent ?? ""),
          referrer: String(data.referrer ?? ""),
          label: data.label ? String(data.label) : undefined,
          timestamp: String(data.timestamp ?? ""),
        });
      });
      return result;
    } else {
      return requestMock<VisitorLog[]>(`sessions/${sessionId}/logs`);
    }
  },

  updateSession: async (
    sessionId: string,
    updateData: { name: string; hostname: string; redirect: string }
  ) => {
    if (isFirebaseConfigured && realDb) {
      await updateDoc(doc(realDb, "sessions", sessionId), updateData);
    } else {
      await requestMock(`sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    }
  },

  updateSessionPreview: async (
    sessionId: string,
    updateData: Pick<
      Campaign,
      "previewTitle" | "previewDescription" | "previewImage" | "previewSiteName"
    >
  ) => {
    if (isFirebaseConfigured && realDb) {
      await updateDoc(doc(realDb, "sessions", sessionId), updateData);
    } else {
      await requestMock(`sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    }
  },

  deleteLog: async (sessionId: string, logId: string) => {
    if (isFirebaseConfigured && realDb) {
      await deleteDoc(doc(realDb, `sessions/${sessionId}/logs`, logId));
    } else {
      await requestMock(`sessions/${sessionId}/logs/${logId}`, { method: "DELETE" });
    }
  },

  updateLog: async (sessionId: string, logId: string, updateData: Partial<Pick<VisitorLog, "label">>) => {
    if (isFirebaseConfigured && realDb) {
      await updateDoc(doc(realDb, `sessions/${sessionId}/logs`, logId), updateData);
    } else {
      await requestMock(`sessions/${sessionId}/logs/${logId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    }
  },
};
