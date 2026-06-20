"use client";

interface HeaderProps {
  isMock: boolean;
  userEmail: string;
  onLogout: () => void;
}

export default function Header({ isMock, userEmail, onLogout }: HeaderProps) {
  return (
    <header>
      <div className="logo-container">
        <span className="logo-icon">🛡️</span>
        <span className="logo-text">loc-phish</span>
      </div>
      <div className="nav-actions">
        <span className={`mode-badge ${!isMock ? "real" : ""}`}>
          {isMock ? "Mock DB" : "Cloud Firebase"}
        </span>
        <span className="user-email-display">{userEmail}</span>
        <button onClick={onLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>
    </header>
  );
}
