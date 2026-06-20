import { auth } from "../firebase-config.js";

const appLoading = document.getElementById("appLoading");
const authScreen = document.getElementById("authScreen");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const authError = document.getElementById("authError");

// Monitor Auth State - Redirect to dashboard if already logged in
auth.onAuthStateChanged((user) => {
  appLoading.style.display = "none";
  if (user) {
    // Already authenticated, redirect to campaign dashboard
    window.location.replace("/pages/dashboard.html");
  } else {
    // Show login interface
    authScreen.style.display = "block";
  }
});

// Google Sign-In Action
googleSignInBtn.addEventListener("click", async () => {
  authError.style.display = "none";
  try {
    await auth.loginWithGoogle();
  } catch (err) {
    console.error("Auth error:", err);
    authError.textContent = err.message;
    authError.style.display = "block";
  }
});
