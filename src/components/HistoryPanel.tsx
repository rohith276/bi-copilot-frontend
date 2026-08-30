"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "./Toast";
import Link from "next/link";
import { PaperTape, TechnicalBadge } from "./PaperAccents";

interface Dataset {
    id: number;
    filename: string;
    file_type: string;
    row_count: number;
    column_count: number;
    created_at: string;
}

export default function HistoryPanel() {
    const { addToast } = useToast();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [queryLog] = useState<{ query: string; time: string }[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            return JSON.parse(localStorage.getItem("bi_query_log") || "[]");
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                const data = await apiFetch("/datasets/");
                setDatasets(data);
            } catch {
                addToast("Failed to load execution history", "error");
            } finally {
                setLoading(false);
            }
        };
        void fetchDatasets();
    }, [addToast]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-(--border-color) pb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-(--foreground) uppercase tracking-wider">EXECUTION LOG & AUDIT HISTORY</h2>
                    <p className="text-xs text-(--brand-secondary) mt-0.5">Comprehensive audit ledger of catalog dataset ingestions and AI queries.</p>
                </div>
                <TechnicalBadge text="AUDIT LEDGER" status="blueprint" />
            </div>

            {/* Dataset History Ledger */}
            <div className="paper-sheet p-5 relative overflow-hidden">
                <PaperTape className="right-4 top-2 rotate-2" />
                <h3 className="font-semibold text-xs text-(--foreground) uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-(--border-color) pb-2">
                    <span>📂</span> INGESTED DATASET SPECIFICATIONS
                </h3>
                {loading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-(--brand-secondary) text-xs font-mono">
                        <svg className="animate-spin w-4 h-4 text-(--brand-primary)" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Querying history logs...</span>
                    </div>
                ) : datasets.length === 0 ? (
                    <div className="text-center py-8 text-(--brand-secondary) text-xs font-mono">
                        <p className="font-bold uppercase tracking-wider">NO DATASETS RECORDED</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {datasets.map((ds) => (
                            <div
                                key={ds.id}
                                className="flex items-center justify-between bg-(--surface-hover) border border-(--border-color) p-3 rounded font-mono text-xs hover:bg-(--surface-muted) transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-(--brand-primary) font-bold">#{ds.id}</span>
                                    <div>
                                        <p className="font-bold text-(--foreground)">{ds.filename}</p>
                                        <p className="text-[10px] text-(--brand-secondary)">
                                            {ds.file_type.toUpperCase()} · {ds.row_count?.toLocaleString()} rows · {ds.column_count} cols ·{" "}
                                            {new Date(ds.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/explore/${ds.id}`}
                                        className="paper-button paper-button-secondary text-xs py-1 px-2.5 uppercase font-bold"
                                    >
                                        Inspect Specs →
                                    </Link>
                                    <Link
                                        href={`/dashboard/${ds.id}`}
                                        className="paper-button bg-blue-50 dark:bg-blue-950/40 text-(--brand-primary) border border-blue-200 text-xs py-1 px-2.5 uppercase font-bold"
                                    >
                                        Dashboard 📊
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Query Execution Log */}
            <div className="paper-sheet p-5 relative overflow-hidden">
                <PaperTape className="left-4 top-2 -rotate-2" />
                <h3 className="font-semibold text-xs text-(--foreground) uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-(--border-color) pb-2">
                    <span>💬</span> RECENT AI COPILOT EXECUTIONS
                </h3>
                {queryLog.length === 0 ? (
                    <div className="text-center py-8 text-(--brand-secondary) text-xs font-mono">
                        <p className="font-bold uppercase tracking-wider">NO COPILOT EXECUTIONS RECORDED</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {queryLog.slice().reverse().map((q, i) => (
                            <div key={i} className="bg-(--surface-hover) border border-(--border-color) p-3 rounded font-mono text-xs">
                                <p className="font-bold text-(--foreground)">"{q.query}"</p>
                                <p className="text-[10px] text-(--brand-secondary) mt-1">{q.time}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
