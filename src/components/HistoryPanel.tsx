"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "./Toast";
import Link from "next/link";

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
            } catch (e) {
                addToast("Failed to load history", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchDatasets();
    }, []);

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">History</h2>
                <p className="text-slate-400 text-sm font-medium">All uploaded datasets and recent AI queries.</p>
            </div>

            {/* Dataset History */}
            <div className="bg-surface-100 rounded-[28px] p-6 border border-white/10 shadow-xl">
                <h3 className="font-black text-sm text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span>📂</span> Uploaded Datasets
                </h3>
                {loading ? (
                    <div className="flex items-center justify-center py-10 gap-3">
                        <div className="w-6 h-6 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading...</span>
                    </div>
                ) : datasets.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No datasets uploaded yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {datasets.map((ds) => (
                            <div
                                key={ds.id}
                                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-white/5 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm ${ds.file_type.includes("csv") ? "bg-indigo-600" : "bg-emerald-500"}`}>
                                        📄
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-foreground">{ds.filename}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                                            #{ds.id} · {ds.row_count?.toLocaleString()} rows · {ds.column_count} cols ·{" "}
                                            {new Date(ds.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <Link
                                        href={`/dashboard/${ds.id}`}
                                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href={`/explore/${ds.id}`}
                                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                    >
                                        Explore
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Query Log */}
            <div className="bg-surface-100 rounded-[28px] p-6 border border-white/10 shadow-xl">
                <h3 className="font-black text-sm text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span>💬</span> Recent AI Copilot Queries
                </h3>
                {queryLog.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <p className="text-4xl mb-3">🤖</p>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No AI queries yet</p>
                        <p className="text-xs text-slate-400 mt-2">Use the AI Copilot tab in Data Explorer</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queryLog.slice().reverse().map((q, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                                <p className="text-sm font-medium text-foreground mb-1">"{q.query}"</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{q.time}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
