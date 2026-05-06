"use client";

import { use } from "react";
import Dashboard from "@/components/Dashboard";
import Link from "next/link";

interface DashboardPageProps {
    params: Promise<{ id: string }>;
}

export default function DashboardPage({ params }: DashboardPageProps) {
    const { id } = use(params);
    const datasetId = parseInt(id, 10);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Top Nav */}
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
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                            Dashboard — Dataset #{datasetId}
                        </span>
                    </div>
                </div>

                <Link
                    href={`/explore/${datasetId}`}
                    className="px-5 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                    🔍 Explore Data
                </Link>
            </nav>

            {/* Page Header */}
            <div className="max-w-7xl mx-auto px-8 pt-10 pb-6">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        Business Intelligence Dashboard
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        Intelligence{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Overview
                        </span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                        Auto-generated KPIs and charts from your dataset. Explore deeper insights in the Data Explorer.
                    </p>
                </div>

                <Dashboard datasetId={datasetId} />
            </div>
        </div>
    );
}
