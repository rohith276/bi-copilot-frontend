"use client";

import { use } from "react";
import Dashboard from "@/components/Dashboard";
import Link from "next/link";
import GraphPaperBackground from "@/components/GraphPaperBackground";
import { TechnicalBadge, PaperTape } from "@/components/PaperAccents";

interface DashboardPageProps {
    params: Promise<{ id: string }>;
}

export default function DashboardPage({ params }: DashboardPageProps) {
    const { id } = use(params);
    const datasetId = parseInt(id, 10);

    return (
        <GraphPaperBackground className="min-h-screen">
            {/* Top Navigation Header */}
            <nav className="sticky top-0 z-50 bg-surface-100/90 backdrop-blur-md border-b border-border-color px-8 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-brand-secondary hover:text-foreground transition-colors text-xs font-mono font-bold group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>← CATALOG INDEX</span>
                    </Link>
                    <div className="w-px h-5 bg-border-color" />
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-foreground">
                            EXECUTIVE DASHBOARD — SPEC #{datasetId}
                        </span>
                        <TechnicalBadge text="LIVE ANALYTICS" status="success" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href={`http://localhost:8000/exports/${datasetId}/markdown`}
                        download={`dashboard_export_${datasetId}.md`}
                        className="font-mono text-xs uppercase tracking-wider flex items-center gap-2 px-4 py-2 rounded bg-(--brand-primary) text-white hover:opacity-90 transition-opacity shadow-sm border border-(--brand-primary)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Report
                    </a>
                    <Link
                        href={`/explore/${datasetId}`}
                        className="saas-button saas-button-secondary font-mono text-xs uppercase tracking-wider"
                    >
                        🔍 Explore Data Specs →
                    </Link>
                </div>
            </nav>

            {/* Page Header */}
            <div className="max-w-7xl mx-auto px-8 pt-8 pb-6">
                <div className="paper-sheet p-6 mb-8 relative overflow-hidden">
                    <PaperTape className="right-8 top-3 rotate-3" />
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-secondary uppercase tracking-widest">
                            NOTEBOOK SHEET // AUTOMATED EXECUTIVE OVERVIEW
                        </span>
                        <span className="text-[10px] font-mono text-brand-primary">REF-ID: DB-{datasetId}</span>
                    </div>
                    <h1 className="text-3xl font-mono font-black text-foreground tracking-tight mb-1">
                        BUSINESS INTELLIGENCE OVERVIEW
                    </h1>
                    <p className="text-brand-secondary text-xs font-mono">
                        Auto-computed Key Performance Indicators, trend aggregations, and technical charts.
                    </p>
                </div>

                <Dashboard datasetId={datasetId} />
            </div>
        </GraphPaperBackground>
    );
}
