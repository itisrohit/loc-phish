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
  const focusFrameRef = useRef<number | null>(null);

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
      focusFrameRef.current = window.requestAnimationFrame(() => {
        nameRef.current?.focus();
      });
    }

    return () => {
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
      }
    };
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
          <h2 className="modal-title">
            {isEditing ? "Edit Campaign" : "New Campaign"}
          </h2>
          <button className="close-modal-x" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="modal-error">
              [ERROR]: {error}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="campaignName">Campaign Name</label>
            <input
              ref={nameRef}
              type="text"
              id="campaignName"
              className="form-control"
              placeholder="Internal Test"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="campaignHostname">Fake Domain</label>
            <input
              type="text"
              id="campaignHostname"
              className="form-control"
              placeholder="google.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="campaignRedirect">Redirect URL</label>
            <input
              type="text"
              id="campaignRedirect"
              className="form-control"
              placeholder="https://my-actual-site.com"
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
