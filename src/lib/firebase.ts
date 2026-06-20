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
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

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

// ==========================================
// UNIFIED DATABASE INTERFACE
// ==========================================
export const db = {
  getSession: async (sessionId: string) => {
    if (isFirebaseConfigured && realDb) {
      const docRef = doc(realDb, "sessions", sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      return sessions.find((s: { id: string }) => s.id === sessionId) || null;
    }
  },

  createSession: async (
    userId: string,
    sessionData: { name: string; hostname: string; redirect: string }
  ) => {
    const data = {
      ...sessionData,
      userId,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && realDb) {
      const docRef = await addDoc(collection(realDb, "sessions"), data);
      return { id: docRef.id, ...data };
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      const newSession = {
        id: "session-" + Math.random().toString(36).substr(2, 9),
        ...data,
      };
      sessions.push(newSession);
      localStorage.setItem("mock_sessions", JSON.stringify(sessions));
      return newSession;
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
      const result: Array<{
        id: string;
        name: string;
        hostname: string;
        redirect: string;
        userId: string;
        createdAt: string;
      }> = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        result.push({
          id: d.id,
          name: String(data.name ?? ""),
          hostname: String(data.hostname ?? ""),
          redirect: String(data.redirect ?? ""),
          userId: String(data.userId ?? ""),
          createdAt: String(data.createdAt ?? ""),
        });
      });
      return result;
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      return sessions
        .filter((s: { userId: string }) => s.userId === userId)
        .sort((a: { createdAt: string }, b: { createdAt: string }) =>
          b.createdAt.localeCompare(a.createdAt)
        );
    }
  },

  deleteSession: async (sessionId: string) => {
    if (isFirebaseConfigured && realDb) {
      await deleteDoc(doc(realDb, "sessions", sessionId));
    } else {
      let sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      sessions = sessions.filter((s: { id: string }) => s.id !== sessionId);
      localStorage.setItem("mock_sessions", JSON.stringify(sessions));

      let logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      logs = logs.filter((l: { sessionId: string }) => l.sessionId !== sessionId);
      localStorage.setItem("mock_logs", JSON.stringify(logs));
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
      const logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      logs.push({
        id: "log-" + Math.random().toString(36).substr(2, 9),
        sessionId,
        ...data,
      });
      localStorage.setItem("mock_logs", JSON.stringify(logs));
    }
  },

  getLogs: async (sessionId: string) => {
    if (isFirebaseConfigured && realDb) {
      const q = query(
        collection(realDb, `sessions/${sessionId}/logs`),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const result: Array<{
        id: string;
        sessionId: string;
        ip: string;
        rayId: string;
        userAgent: string;
        referrer: string;
        label?: string;
        timestamp: string;
      }> = [];
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
      const logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      return logs
        .filter((l: { sessionId: string }) => l.sessionId === sessionId)
        .sort((a: { timestamp: string }, b: { timestamp: string }) =>
          b.timestamp.localeCompare(a.timestamp)
        );
    }
  },

  updateSession: async (
    sessionId: string,
    updateData: { name: string; hostname: string; redirect: string }
  ) => {
    if (isFirebaseConfigured && realDb) {
      await updateDoc(doc(realDb, "sessions", sessionId), updateData);
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      const idx = sessions.findIndex((s: { id: string }) => s.id === sessionId);
      if (idx > -1) {
        sessions[idx] = { ...sessions[idx], ...updateData };
        localStorage.setItem("mock_sessions", JSON.stringify(sessions));
      }
    }
  },

  deleteLog: async (sessionId: string, logId: string) => {
    if (isFirebaseConfigured && realDb) {
      await deleteDoc(doc(realDb, `sessions/${sessionId}/logs`, logId));
    } else {
      let logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      logs = logs.filter((l: { id: string }) => l.id !== logId);
      localStorage.setItem("mock_logs", JSON.stringify(logs));
    }
  },

  updateLog: async (sessionId: string, logId: string, updateData: { label: string }) => {
    if (isFirebaseConfigured && realDb) {
      await updateDoc(doc(realDb, `sessions/${sessionId}/logs`, logId), updateData);
    } else {
      const logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      const idx = logs.findIndex((l: { id: string }) => l.id === logId);
      if (idx > -1) {
        logs[idx] = { ...logs[idx], ...updateData };
        localStorage.setItem("mock_logs", JSON.stringify(logs));
      }
    }
  },
};
