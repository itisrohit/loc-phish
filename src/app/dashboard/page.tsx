"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [isMobileView, setIsMobileView] = useState(false);
  const selectedCampaignIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedCampaignIdRef.current = selectedCampaign?.id ?? null;
  }, [selectedCampaign]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const updateViewport = (event?: MediaQueryListEvent) => {
      setIsMobileView(event ? event.matches : mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

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
          publicSlug: string;
          previewTitle?: string;
          previewDescription?: string;
          previewImage?: string;
          previewSiteName?: string;
        }) => ({
          id: s.id,
          name: String(s.name ?? ""),
          hostname: String(s.hostname ?? ""),
          redirect: String(s.redirect ?? ""),
          userId: String(s.userId ?? ""),
          createdAt: String(s.createdAt ?? ""),
          publicSlug: String(s.publicSlug ?? ""),
          previewTitle: s.previewTitle,
          previewDescription: s.previewDescription,
          previewImage: s.previewImage,
          previewSiteName: s.previewSiteName,
        })
      );
      setCampaigns((current) => {
        const isUnchanged =
          current.length === mapped.length &&
          current.every((campaign, index) => {
            const nextCampaign = mapped[index];
            return (
              nextCampaign &&
              campaign.id === nextCampaign.id &&
              campaign.name === nextCampaign.name &&
              campaign.hostname === nextCampaign.hostname &&
              campaign.redirect === nextCampaign.redirect &&
              campaign.createdAt === nextCampaign.createdAt &&
              campaign.publicSlug === nextCampaign.publicSlug &&
              campaign.previewTitle === nextCampaign.previewTitle &&
              campaign.previewDescription === nextCampaign.previewDescription &&
              campaign.previewImage === nextCampaign.previewImage &&
              campaign.previewSiteName === nextCampaign.previewSiteName
            );
          });

        return isUnchanged ? current : mapped;
      });

      setSelectedCampaign((current) => {
        if (mapped.length === 0) return null;

        const selectedId = current?.id ?? selectedCampaignIdRef.current;
        if (!selectedId) {
          return isMobileView ? null : mapped[0];
        }

        const updated = mapped.find((campaign) => campaign.id === selectedId);
        return updated ?? (isMobileView ? null : mapped[0]);
      });
    } catch (err) {
      console.error("Error loading campaigns:", err);
    }
  }, [isMobileView, user]);

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
        publicSlug: newCampaign.publicSlug,
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
      <div className="dashboard-root loading-root">
        <div className="dashboard-ambient">
          <div className="dashboard-grid" />
        </div>
        <div className="loading-text">
          LOADING_SYSTEM...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasCampaigns = campaigns.length > 0;
  const showMobileList = isMobileView && (!hasCampaigns || !selectedCampaign);
  const showDesktopLayout = hasCampaigns && !isMobileView;
  const showMobileDetail = isMobileView && !!selectedCampaign;

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  return (
    <div className="dashboard-root">
      {/* Dynamic Background */}
      <div className="dashboard-ambient">
        <div className="dashboard-grid" />
        <div className="dashboard-glow" />
      </div>

      <Header isMock={auth.isMock} userEmail={user.email || ""} onLogout={handleLogout} />

      {showDesktopLayout ? (
        <main className="dashboard-layout">
          <Sidebar
            campaigns={campaigns}
            selectedId={selectedCampaign?.id || null}
            onSelect={handleSelectCampaign}
            onCreateNew={() => setShowCreateModal(true)}
            onDelete={handleDeleteCampaign}
          />
          {selectedCampaign && (
            <CampaignDetail
              campaign={selectedCampaign}
              onEdit={() => setEditCampaign(selectedCampaign)}
              onRefresh={loadCampaigns}
            />
          )}
        </main>
      ) : showMobileList ? (
        <main className="dashboard-layout dashboard-layout-mobile">
          <Sidebar
            campaigns={campaigns}
            selectedId={selectedCampaign?.id || null}
            onSelect={handleSelectCampaign}
            onCreateNew={() => setShowCreateModal(true)}
            onDelete={handleDeleteCampaign}
          />
        </main>
      ) : showMobileDetail && selectedCampaign ? (
        <main className="dashboard-layout dashboard-layout-mobile">
          <CampaignDetail
            campaign={selectedCampaign}
            onEdit={() => setEditCampaign(selectedCampaign)}
            onRefresh={loadCampaigns}
            onBack={() => setSelectedCampaign(null)}
            showBackButton
          />
        </main>
      ) : (
        <div className="onboarding-container">
          <div className="dashboard-card onboarding-card">
            <div className="empty-state-visual">
              <svg
                style={{ width: "48px", height: "48px" }}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="12" y="12" width="40" height="40" stroke="var(--color-rose)" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M32 20 V44 M20 32 H44" stroke="var(--color-rose)" strokeWidth="0.5" />
                <circle cx="32" cy="32" r="2" fill="var(--color-rose)" />
              </svg>
            </div>
            <h2>DASHBOARD</h2>
            <p>
              No active campaigns found. <br /> Create a new campaign to start tracking.
            </p>
            <button
              className="btn btn-primary onboarding-cta"
              onClick={() => setShowCreateModal(true)}
            >
              New Campaign
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
