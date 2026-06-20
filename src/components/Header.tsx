"use client";

interface HeaderProps {
  isMock: boolean;
  userEmail: string;
  onLogout: () => void;
}

export default function Header({ userEmail, onLogout }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="logo-container">
        <span className="logo-text">
          LP <span style={{ opacity: 0.4 }}>/</span> CONTROL_CENTER
        </span>
      </div>
      <div className="nav-actions">
        <div className="system-status">
          <div className="status-bar">
            <div className="status-bar-fill"></div>
          </div>
        </div>
        <span className="user-email-display mono">{userEmail}</span>
        <button onClick={onLogout} className="sign-out-trigger">
          Logout
        </button>
      </div>
    </header>
  );
}
