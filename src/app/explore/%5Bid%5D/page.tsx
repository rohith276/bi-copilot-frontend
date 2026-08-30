"use client";

import { useState, Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DataExplorer from "@/components/DataExplorer";
import AnalyticsExplorer from "@/components/AnalyticsExplorer";
import GraphPaperBackground from "@/components/GraphPaperBackground";
import { TechnicalBadge } from "@/components/PaperAccents";

interface ExplorePageProps {
    params: Promise<{ id: string }>;
}

function ExploreContent({ datasetId }: { datasetId: number }) {
    const searchParams = useSearchParams();
    const defaultView = searchParams.get("view") === "analytics" ? "analytics" : "explore";
    const [view, setView] = useState<"explore" | "analytics">(defaultView);

    return (
        <>
            {/* Enterprise Navigation Header */}
            <nav className="sticky top-0 z-50 bg-(--surface) border-b border-(--border-color) px-6 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-(--brand-secondary) hover:text-(--foreground) transition-colors text-xs font-semibold group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-(--brand-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Catalog</span>
                    </Link>
                    <span className="text-(--border-color)">/</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-(--foreground) font-mono">Dataset #{datasetId}</span>
                        <TechnicalBadge text="ACTIVE" status="blueprint" />
                    </div>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex bg-(--surface-hover) border border-(--border-color) rounded p-0.5 gap-0.5">
                    {(["explore", "analytics"] as const).map((currentView) => (
                        <button
                            key={currentView}
                            onClick={() => setView(currentView)}
                            className={`px-4 py-1 rounded text-xs font-semibold transition-colors ${
                                view === currentView
                                    ? "bg-(--brand-primary) text-white"
                                    : "text-(--brand-secondary) hover:text-(--foreground)"
                            }`}
                        >
                            {currentView === "explore" ? "Data Explorer" : "AI Analytics Engine"}
                        </button>
                    ))}
                </div>

                <Link
                    href={`/dashboard/${datasetId}`}
                    className="saas-button saas-button-primary text-xs"
                >
                    Executive Dashboard 📊
                </Link>
            </nav>

            <div className="max-w-400 mx-auto px-6 py-6">
                {view === "explore" ? (
                    <DataExplorer datasetId={datasetId} />
                ) : (
                    <AnalyticsExplorer datasetId={datasetId} activeModule={searchParams.get("module") || undefined} />
                )}
            </div>
        </>
    );
}

export default function ExplorePage({ params }: ExplorePageProps) {
    const { id } = use(params);
    const datasetId = parseInt(id, 10);

    return (
        <GraphPaperBackground className="min-h-screen">
            <Suspense fallback={
                <div className="p-8 text-center text-xs font-mono text-(--brand-secondary)">
                    Loading dataset explorer...
                </div>
            }>
                <ExploreContent datasetId={datasetId} />
            </Suspense>
        </GraphPaperBackground>
    );
}
