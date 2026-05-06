"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DataExplorer from "@/components/DataExplorer";
import AnalyticsExplorer from "@/components/AnalyticsExplorer";

interface ExplorePageProps {
    params: Promise<{ id: string }>;
}

export default function ExplorePage({ params }: ExplorePageProps) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const datasetId = parseInt(id, 10);
    const defaultView = searchParams.get("view") === "analytics" ? "analytics" : "explore";
    const [view, setView] = useState<"explore" | "analytics">(defaultView);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 px-8 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-xs font-black uppercase tracking-widest">Library</span>
                    </Link>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Dataset #{datasetId}</span>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
                    {(["explore", "analytics"] as const).map((currentView) => (
                        <button
                            key={currentView}
                            onClick={() => setView(currentView)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                view === currentView
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md"
                                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            {currentView === "explore" ? "Data Explorer" : "AI Analytics"}
                        </button>
                    ))}
                </div>

                <Link
                    href={`/dashboard/${datasetId}`}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                    View Dashboard
                </Link>
            </nav>

            <div className="max-w-[1600px] mx-auto px-6 py-6">
                {view === "explore" ? (
                    <DataExplorer datasetId={datasetId} activeModule={searchParams.get("module") || undefined} />
                ) : (
                    <AnalyticsExplorer datasetId={datasetId} activeModule={searchParams.get("module") || undefined} />
                )}
            </div>
        </div>
    );
}
