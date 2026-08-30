"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DataExplorer from "@/components/DataExplorer";
import AnalyticsExplorer from "@/components/AnalyticsExplorer";
import VisualBuilder from "@/components/explorer/VisualBuilder";
import AskAIExplorer from "@/components/AskAIExplorer";
import GraphPaperBackground from "@/components/GraphPaperBackground";
import { TechnicalBadge } from "@/components/PaperAccents";
import JoinBuilder from "@/components/JoinBuilder";
import ShareDialog from "@/components/ShareDialog";

interface ExplorePageProps {
    params: Promise<{ id: string }>;
}

export default function ExplorePage({ params }: ExplorePageProps) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const datasetId = parseInt(id, 10);
    const defaultView = searchParams.get("view") === "analytics" ? "analytics" : searchParams.get("view") === "ask" ? "ask" : searchParams.get("view") === "builder" ? "builder" : "explore";
    const [view, setView] = useState<"explore" | "analytics" | "ask" | "builder">(defaultView as "explore" | "analytics" | "ask" | "builder");
    const [shareOpen, setShareOpen] = useState(false);

    return (
        <div className="min-h-screen">
            {/* Top Engineering Blueprint Navbar */}
            <nav className="sticky top-0 z-50 bg-(--surface)/90 backdrop-blur-md border-b border-(--border-color) px-8 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-(--brand-secondary) hover:text-(--foreground) transition-colors group text-xs font-mono font-bold"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-(--brand-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>← CATALOG INDEX</span>
                    </Link>
                    <div className="w-px h-5 bg-(--border-color)" />
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-(--foreground)">DATASET SPEC #{datasetId}</span>
                        <TechnicalBadge text="ACTIVE" status="blueprint" />
                    </div>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex bg-(--surface-hover) border border-(--border-color) rounded p-1 gap-1">
                    {(["explore", "analytics", "builder", "ask"] as const).map((currentView) => (
                        <button
                            key={currentView}
                            onClick={() => setView(currentView)}
                            className={`px-5 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                                view === currentView
                                    ? "bg-(--brand-primary) text-white shadow"
                                    : "text-(--brand-secondary) hover:text-(--foreground)"
                            }`}
                        >
                            {currentView === "explore" ? "Data Explorer" : currentView === "analytics" ? "AI Analytics" : currentView === "builder" ? "Visual Builder" : "Ask AI"}
                        </button>
                    ))}
                </div>

                <JoinBuilder
                    currentDatasetId={datasetId}
                    onJoinComplete={(newId) => {
                        window.location.href = `/explore/${newId}`;
                    }}
                />
                <button
                    onClick={() => setShareOpen(true)}
                    className="saas-button saas-button-secondary font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Collaborate
                </button>
                <Link
                    href={`/dashboard/${datasetId}`}
                    className="saas-button saas-button-primary font-mono text-xs uppercase tracking-wider"
                >
                    View Executive Dashboard →
                </Link>
            </nav>

            <ShareDialog datasetId={datasetId} isOpen={shareOpen} onClose={() => setShareOpen(false)} />

            <div className="max-w-400 mx-auto px-6 py-6 h-full min-h-[calc(100vh-80px)]">
                {view === "explore" ? (
                    <DataExplorer datasetId={datasetId} />
                ) : view === "analytics" ? (
                    <AnalyticsExplorer datasetId={datasetId} activeModule={searchParams.get("module") || undefined} />
                ) : view === "builder" ? (
                    <VisualBuilder datasetId={datasetId} />
                ) : (
                    <AskAIExplorer datasetId={datasetId} />
                )}
            </div>
        </div>
    );
}
