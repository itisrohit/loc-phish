"use client";

import type { Campaign } from "@/types";

interface SidebarProps {
  campaigns: Campaign[];
  selectedId: string | null;
  onSelect: (campaign: Campaign) => void;
  onCreateNew: () => void;
  onDelete: (id: string, name: string) => void;
}

export default function Sidebar({
  campaigns,
  selectedId,
  onSelect,
  onCreateNew,
  onDelete,
}: SidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <button onClick={onCreateNew} className="btn btn-primary w-full mb-5">
        <span>➕ New Campaign</span>
      </button>

      <div
        className="mb-3 text-[11px] uppercase tracking-widest font-bold px-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        Your Campaigns
      </div>

      <div className="sessions-list">
        {campaigns.length === 0 ? (
          <div className="no-sessions-sidebar">
            <svg
              viewBox="0 0 24 24"
              className="sidebar-empty-icon"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M12 8v8M8 12h8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>No active campaigns</span>
          </div>
        ) : (
          campaigns.map((campaign) => {
            const dateFormatted = new Date(campaign.createdAt).toLocaleDateString();
            const isActive = selectedId === campaign.id;

            return (
              <div
                key={campaign.id}
                className={`session-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(campaign)}
              >
                <div className="session-header">
                  <span className="session-name">{campaign.name}</span>
                  <button
                    className="btn btn-danger text-[10px] px-1.5 py-0.5"
                    style={{ fontSize: "10px", padding: "2px 6px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(campaign.id, campaign.name);
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="session-hostname">{campaign.hostname}</div>
                <div className="session-meta">
                  <span className="session-date">{dateFormatted}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
