"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import type { Campaign } from "@/types";
import type { AuthUser } from "@/lib/firebase";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CampaignDetail from "@/components/CampaignDetail";
import CampaignModal from "@/components/CampaignModal";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        router.replace("/login");
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [router]);

  const loadCampaigns = useCallback(async () => {
    if (!user) return;
    try {
      const data = await db.getSessions(user.uid);
      const mapped: Campaign[] = data.map(
        (s: {
          id: string;
          name: string;
          hostname: string;
          redirect: string;
          userId: string;
          createdAt: string;
        }) => ({
          id: s.id,
          name: String(s.name ?? ""),
          hostname: String(s.hostname ?? ""),
          redirect: String(s.redirect ?? ""),
          userId: String(s.userId ?? ""),
          createdAt: String(s.createdAt ?? ""),
        })
      );
      setCampaigns(mapped);

      if (mapped.length === 0) {
        setSelectedCampaign(null);
      } else if (!selectedCampaign || !mapped.find((c: Campaign) => c.id === selectedCampaign.id)) {
        setSelectedCampaign(mapped[0]);
      } else {
        const updated = mapped.find((c: Campaign) => c.id === selectedCampaign.id);
        if (updated) setSelectedCampaign(updated);
      }
    } catch (err) {
      console.error("Error loading campaigns:", err);
    }
  }, [user, selectedCampaign]);

  useEffect(() => {
    if (user) loadCampaigns();
  }, [user, loadCampaigns]);

  const handleLogout = async () => {
    await auth.logout();
    router.replace("/login");
  };

  const handleCreateCampaign = async (data: {
    name: string;
    hostname: string;
    redirect: string;
  }) => {
    if (!user) throw new Error("Not authenticated");
    try {
      const newCampaign = await db.createSession(user.uid, data);
      await loadCampaigns();
      setSelectedCampaign({
        id: newCampaign.id,
        name: newCampaign.name,
        hostname: newCampaign.hostname,
        redirect: newCampaign.redirect,
        userId: newCampaign.userId,
        createdAt: newCampaign.createdAt,
      });
    } catch (err) {
      console.error("Failed to create campaign:", err);
      throw err;
    }
  };

  const handleEditCampaign = async (data: { name: string; hostname: string; redirect: string }) => {
    if (!editCampaign) throw new Error("No campaign selected");
    try {
      await db.updateSession(editCampaign.id, data);
      setEditCampaign(null);
      await loadCampaigns();
    } catch (err) {
      console.error("Failed to update campaign:", err);
      throw err;
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete session "${name}" and all of its visitor logs?`)) {
      await db.deleteSession(id);
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
      await loadCampaigns();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "100vh" }}>
        <div className="loading-text">Loading secure portal...</div>
      </div>
    );
  }

  if (!user) return null;

  const hasCampaigns = campaigns.length > 0;

  return (
    <div>
      <Header isMock={auth.isMock} userEmail={user.email || ""} onLogout={handleLogout} />

      {hasCampaigns ? (
        <main className="dashboard-layout">
          <Sidebar
            campaigns={campaigns}
            selectedId={selectedCampaign?.id || null}
            onSelect={setSelectedCampaign}
            onCreateNew={() => setShowCreateModal(true)}
            onDelete={handleDeleteCampaign}
          />
          {selectedCampaign && (
            <CampaignDetail
              campaign={selectedCampaign}
              onEdit={() => setEditCampaign(selectedCampaign)}
            />
          )}
        </main>
      ) : (
        <div className="onboarding-container">
          <div className="dashboard-card onboarding-card">
            <div className="empty-state-visual">
              <svg
                style={{ width: "64px", height: "64px" }}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="rgba(224, 169, 140, 0.12)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="20"
                  stroke="rgba(224, 169, 140, 0.22)"
                  strokeWidth="1.5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="10"
                  stroke="rgba(224, 169, 140, 0.35)"
                  strokeWidth="1.5"
                />
                <line
                  x1="32"
                  y1="4"
                  x2="32"
                  y2="60"
                  stroke="rgba(224, 169, 140, 0.15)"
                  strokeWidth="1.5"
                />
                <line
                  x1="4"
                  y1="32"
                  x2="60"
                  y2="32"
                  stroke="rgba(224, 169, 140, 0.15)"
                  strokeWidth="1.5"
                />
                <line
                  x1="32"
                  y1="32"
                  x2="50"
                  y2="14"
                  stroke="#e0a98c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="radar-hand"
                  style={{ transformOrigin: "32px 32px" }}
                />
              </svg>
            </div>
            <h2>Welcome to the Control Room</h2>
            <p>
              Configure a Turnstile-cloaked redirect campaign session to inspect real-time visitor
              traffic and device telemetry.
            </p>
            <button
              className="btn btn-primary onboarding-cta"
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Create Campaign
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampaign}
      />

      {/* Edit Modal */}
      <CampaignModal
        isOpen={!!editCampaign}
        onClose={() => setEditCampaign(null)}
        onSubmit={handleCreateCampaign}
        editData={editCampaign}
        onSubmitEdit={handleEditCampaign}
      />
    </div>
  );
}
