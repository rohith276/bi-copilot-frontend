"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "./Toast";

interface IntelligenceReportProps {
    datasetId: number;
}

export default function IntelligenceReport({ datasetId }: IntelligenceReportProps) {
    const { addToast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const generateReport = async () => {
        setLoading(true);
        setOpen(true);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/report`);
            setReport(result);
        } catch (e: any) {
            addToast(e.message || "Failed to generate report", "error");
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const qualityColor: Record<string, string> = {
        Excellent: "text-emerald-600 bg-emerald-50 border-emerald-200",
        Good: "text-blue-600 bg-blue-50 border-blue-200",
        Fair: "text-amber-600 bg-amber-50 border-amber-200",
        Poor: "text-red-600 bg-red-50 border-red-200",
    };

    const downloadJSON = () => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `intelligence_report_dataset_${datasetId}.json`;
        a.click();
    };

    const downloadPDF = () => {
        window.print();
    };


    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={generateReport}
                className="px-10 py-3.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white active:scale-95 transition-all flex items-center gap-3 group"
            >
                <svg className="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Intelligence Report
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-8">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-5xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/20 dark:border-white/5 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden flex flex-col my-8 max-h-[90vh]">



                        {/* Modal Header */}
                        <div className="p-8 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">⚡</span>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Intelligence Report</h2>
                                </div>
                                <p className="text-xs text-white/60 font-black uppercase tracking-widest">
                                    Dataset #{datasetId} — Auto-generated analysis
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {report && (
                                    <>
                                        <button
                                            onClick={downloadPDF}
                                            className="px-4 py-2 bg-emerald-600 border border-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg glow-accent"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export PDF
                                        </button>
                                        <button
                                            onClick={downloadJSON}
                                            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Export JSON
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setOpen(false)}
                                    className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-8 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                                        <div className="absolute inset-0 border-8 border-transparent border-b-purple-500 rounded-full animate-spin [animation-duration:1.5s]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Generating Intelligence Report...</p>
                                        <p className="text-xs text-slate-400 mt-2">Analysing all columns, quality metrics and KPIs</p>
                                    </div>
                                </div>
                            ) : report ? (
                                <>
                                    {/* Meta strip */}
                                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>📄 {report.dataset?.filename}</span>
                                        <span>·</span>
                                        <span>{report.dataset?.rows?.toLocaleString()} rows</span>
                                        <span>·</span>
                                        <span>{report.dataset?.columns} columns</span>
                                        <span>·</span>
                                        <span>Generated {new Date(report.generated_at).toLocaleTimeString()}</span>
                                    </div>

                                    {/* Data Quality Card */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-6 border border-slate-100 dark:border-white/5">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-5 flex items-center gap-2">
                                            <span>🔍</span> Data Quality Assessment
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Quality Score</p>
                                                <span className={`px-3 py-1 rounded-xl text-xs font-black border ${qualityColor[report.data_quality?.quality_score] || "text-slate-600 bg-slate-100"}`}>
                                                    {report.data_quality?.quality_score}
                                                </span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Completeness</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{report.data_quality?.completeness_pct}%</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Missing Cells</p>
                                                <p className={`text-2xl font-black ${report.data_quality?.missing_cells > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {report.data_quality?.missing_cells?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Duplicates</p>
                                                <p className={`text-2xl font-black ${report.data_quality?.duplicate_rows > 0 ? "text-red-500" : "text-emerald-600"}`}>
                                                    {report.data_quality?.duplicate_rows}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Insights */}
                                    {report.top_insights?.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                                <span>💡</span> Key Insights
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {report.top_insights.map((ins: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="bg-white dark:bg-slate-800 rounded-[24px] p-5 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                                        style={{ animationDelay: `${i * 80}ms` }}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-xl flex-shrink-0">{ins.icon}</span>
                                                            <div>
                                                                <p className="font-black text-slate-900 dark:text-white text-sm mb-1">{ins.title}</p>
                                                                <p className="text-xs text-slate-500 leading-relaxed">{ins.body}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* KPI Summary */}
                                    {report.executive_summary?.kpis?.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                                <span>📊</span> Numeric KPI Summary
                                            </h3>
                                            <div className="overflow-x-auto rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-900 text-white">
                                                        <tr>
                                                            {["Column", "Mean", "Min", "Max", "Std Dev"].map((h) => (
                                                                <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-50 dark:divide-white/5">
                                                        {report.executive_summary.kpis.map((kpi: any, i: number) => (
                                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                                <td className="px-5 py-3 font-black text-slate-900 dark:text-white text-xs">{kpi.name}</td>
                                                                <td className="px-5 py-3 text-indigo-600 font-black text-xs">{kpi.mean?.toLocaleString()}</td>
                                                                <td className="px-5 py-3 text-slate-500 text-xs">{kpi.min?.toLocaleString()}</td>
                                                                <td className="px-5 py-3 text-slate-500 text-xs">{kpi.max?.toLocaleString()}</td>
                                                                <td className="px-5 py-3 text-slate-400 text-xs">{kpi.std?.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </>

    );
}
