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
      <button onClick={onCreateNew} className="btn btn-primary sidebar-create-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Create Campaign</span>
      </button>

      <div className="sidebar-section-label">
        Active Channels
      </div>

      <div className="sessions-list">
        {campaigns.length === 0 ? (
          <div className="no-sessions-sidebar">
            <span>No Active Channels</span>
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
                <div className="session-status-pulse" />
                <div className="session-header">
                  <span className="session-name">{campaign.name}</span>
                  <span className="session-id-tag">#{campaign.id.slice(-4)}</span>
                </div>
                <div className="session-hostname">{campaign.hostname}</div>
                <div className="session-meta">
                  <span className="session-date">{dateFormatted}</span>
                  <button
                    className="sidebar-delete-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(campaign.id, campaign.name);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
