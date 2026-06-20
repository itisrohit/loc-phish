// firebase-config.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
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
  updateDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = 
  import.meta.env.MODE !== "development" && 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey.trim() !== "";

let app, realAuth, realDb;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    realAuth = getAuth(app);
    realDb = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.warn("Firebase configuration not found. Running in Local Mock Mode (using localStorage).");
}

// ==========================================
// UNIFIED AUTH INTERFACE
// ==========================================
export const auth = {
  isMock: !isFirebaseConfigured,
  
  loginWithGoogle: async () => {
    if (isFirebaseConfigured && realAuth) {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(realAuth, provider);
      return userCredential.user;
    } else {
      // Mock Google Login
      const mockGoogleUser = {
        uid: "mock-google-uid-12345",
        email: "developer@gmail.com",
        displayName: "Developer User",
        photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c"
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

  onAuthStateChanged: (callback) => {
    if (isFirebaseConfigured && realAuth) {
      return onAuthStateChanged(realAuth, callback);
    } else {
      mockAuthListeners.push(callback);
      const user = JSON.parse(localStorage.getItem("mock_current_user") || "null");
      // Execute callback with initial state
      setTimeout(() => callback(user), 0);
      return () => {
        const index = mockAuthListeners.indexOf(callback);
        if (index > -1) mockAuthListeners.splice(index, 1);
      };
    }
  },

  getCurrentUser: () => {
    if (isFirebaseConfigured && realAuth) {
      return realAuth.currentUser;
    } else {
      return JSON.parse(localStorage.getItem("mock_current_user") || "null");
    }
  }
};

const mockAuthListeners = [];
function triggerMockAuthStateChange(user) {
  mockAuthListeners.forEach(cb => cb(user));
}

// ==========================================
// UNIFIED FIRESTORE / DATABASE INTERFACE
// ==========================================
export const db = {
  // Retrieve session by ID
  getSession: async (sessionId) => {
    if (isFirebaseConfigured && realDb) {
      const docRef = doc(realDb, "sessions", sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      return sessions.find(s => s.id === sessionId) || null;
    }
  },

  // Create a new session
  createSession: async (userId, sessionData) => {
    const data = {
      ...sessionData,
      userId,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && realDb) {
      const docRef = await addDoc(collection(realDb, "sessions"), data);
      return { id: docRef.id, ...data };
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      const newSession = {
        id: "session-" + Math.random().toString(36).substr(2, 9),
        ...data
      };
      sessions.push(newSession);
      localStorage.setItem("mock_sessions", JSON.stringify(sessions));
      return newSession;
    }
  },

  // Get all sessions belonging to user
  getSessions: async (userId) => {
    if (isFirebaseConfigured && realDb) {
      const q = query(
        collection(realDb, "sessions"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const result = [];
      querySnapshot.forEach((doc) => {
        result.push({ id: doc.id, ...doc.data() });
      });
      return result;
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      return sessions
        .filter(s => s.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  // Delete a session and its associated logs
  deleteSession: async (sessionId) => {
    if (isFirebaseConfigured && realDb) {
      await deleteDoc(doc(realDb, "sessions", sessionId));
      // In production, we'd also delete logs, but Firestore requires deleting subcollections manually.
      // We will delete the session document itself.
    } else {
      let sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      sessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem("mock_sessions", JSON.stringify(sessions));

      let logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      logs = logs.filter(l => l.sessionId !== sessionId);
      localStorage.setItem("mock_logs", JSON.stringify(logs));
    }
  },

  // Log a visitor record
  logVisit: async (sessionId, logData) => {
    const data = {
      ...logData,
      timestamp: new Date().toISOString()
    };

    if (isFirebaseConfigured && realDb) {
      // Log to a subcollection of the session doc
      await addDoc(collection(realDb, `sessions/${sessionId}/logs`), data);
    } else {
      const logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      logs.push({
        id: "log-" + Math.random().toString(36).substr(2, 9),
        sessionId,
        ...data
      });
      localStorage.setItem("mock_logs", JSON.stringify(logs));
    }
  },

  // Get visitor logs for a session
  getLogs: async (sessionId) => {
    if (isFirebaseConfigured && realDb) {
      const q = query(
        collection(realDb, `sessions/${sessionId}/logs`),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const result = [];
      querySnapshot.forEach((doc) => {
        result.push({ id: doc.id, ...doc.data() });
      });
      return result;
    } else {
      const logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      return logs
        .filter(l => l.sessionId === sessionId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
  },

  // Update an existing session's properties
  updateSession: async (sessionId, updateData) => {
    if (isFirebaseConfigured && realDb) {
      await updateDoc(doc(realDb, "sessions", sessionId), updateData);
    } else {
      const sessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
      const idx = sessions.findIndex(s => s.id === sessionId);
      if (idx > -1) {
        sessions[idx] = { ...sessions[idx], ...updateData };
        localStorage.setItem("mock_sessions", JSON.stringify(sessions));
      }
    }
  },

  // Delete an individual log entry
  deleteLog: async (sessionId, logId) => {
    if (isFirebaseConfigured && realDb) {
      await deleteDoc(doc(realDb, `sessions/${sessionId}/logs`, logId));
    } else {
      let logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      logs = logs.filter(l => l.id !== logId);
      localStorage.setItem("mock_logs", JSON.stringify(logs));
    }
  },

  // Update a log entry's properties (like custom labels)
  updateLog: async (sessionId, logId, updateData) => {
    if (isFirebaseConfigured && realDb) {
      await updateDoc(doc(realDb, `sessions/${sessionId}/logs`, logId), updateData);
    } else {
      const logs = JSON.parse(localStorage.getItem("mock_logs") || "[]");
      const idx = logs.findIndex(l => l.id === logId);
      if (idx > -1) {
        logs[idx] = { ...logs[idx], ...updateData };
        localStorage.setItem("mock_logs", JSON.stringify(logs));
      }
    }
  }
};
