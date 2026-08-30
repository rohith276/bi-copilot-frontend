"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "./Toast";
import { PaperTape, TechnicalBadge } from "./PaperAccents";

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
                className="saas-button saas-button-primary font-mono text-xs uppercase tracking-wider flex items-center gap-2"
            >
                <span>⚡ Generate Intelligence Spec Report</span>
            </button>

            {/* Blueprint Modal */}
            {open && (
                <div className="fixed inset-0 z-200 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center font-mono text-xs">
                    <div className="paper-sheet w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
                        <PaperTape className="right-6 top-2 rotate-2" />

                        {/* Modal Header */}
                        <div className="p-6 bg-surface-200 border-b border-border-color flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-brand-primary font-bold">⚡</span>
                                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">INTELLIGENCE SPECIFICATION REPORT</h2>
                                </div>
                                <p className="text-[11px] text-brand-secondary">
                                    DATASET SPEC #{datasetId} — AUTOMATED ANALYTICAL BLUEPRINT
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {report && (
                                    <>
                                        <button
                                            onClick={downloadPDF}
                                            className="saas-button saas-button-primary text-xs font-mono uppercase"
                                        >
                                            Export PDF
                                        </button>
                                        <button
                                            onClick={downloadJSON}
                                            className="saas-button saas-button-secondary text-xs font-mono uppercase"
                                        >
                                            Export JSON
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-2 text-brand-secondary hover:text-foreground font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar bg-surface-100">

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <svg className="animate-spin w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-brand-secondary font-bold uppercase tracking-wider">GENERATING TECHNICAL REPORT...</p>
                                </div>
                            ) : report ? (
                                <>
                                    {/* Meta strip */}
                                    <div className="flex flex-wrap gap-4 text-[11px] font-bold text-brand-secondary uppercase border-b border-border-color pb-3">
                                        <span>FILE: {report.dataset?.filename}</span>
                                        <span>|</span>
                                        <span>ROWS: {report.dataset?.rows?.toLocaleString()}</span>
                                        <span>|</span>
                                        <span>COLS: {report.dataset?.columns}</span>
                                        <span>|</span>
                                        <span>GENERATED: {new Date(report.generated_at).toLocaleTimeString()}</span>
                                    </div>

                                    {/* Data Quality Card */}
                                    <div className="paper-sheet p-5 bg-surface-200">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
                                            DATA QUALITY ASSESSMENT
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="p-3 bg-surface-100 rounded border border-border-color text-center">
                                                <p className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Quality Rating</p>
                                                <TechnicalBadge text={report.data_quality?.quality_score} status="blueprint" />
                                            </div>
                                            <div className="p-3 bg-surface-100 rounded border border-border-color text-center">
                                                <p className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Completeness</p>
                                                <p className="text-lg font-black text-status-success">{report.data_quality?.completeness_pct}%</p>
                                            </div>
                                            <div className="p-3 bg-surface-100 rounded border border-border-color text-center">
                                                <p className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Missing Cells</p>
                                                <p className={`text-lg font-black ${report.data_quality?.missing_cells > 0 ? "text-status-warning" : "text-status-success"}`}>
                                                    {report.data_quality?.missing_cells?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-surface-100 rounded border border-border-color text-center">
                                                <p className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Duplicates</p>
                                                <p className={`text-lg font-black ${report.data_quality?.duplicate_rows > 0 ? "text-status-danger" : "text-status-success"}`}>
                                                    {report.data_quality?.duplicate_rows}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Insights */}
                                    {report.top_insights?.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
                                                KEY SPECIFICATION INSIGHTS
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                {report.top_insights.map((ins: any, i: number) => (
                                                    <div key={i} className="paper-sheet p-4 flex gap-3">
                                                        <span className="text-xl">{ins.icon}</span>
                                                        <div>
                                                            <p className="font-bold text-foreground text-xs uppercase mb-1">{ins.title}</p>
                                                            <p className="text-[11px] text-brand-secondary leading-relaxed">{ins.body}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* KPI Summary */}
                                    {report.executive_summary?.kpis?.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
                                                NUMERIC KPI SUMMARY LEDGER
                                            </h3>
                                            <div className="border border-border-color rounded overflow-hidden">
                                                <table className="saas-table text-xs">
                                                    <thead>
                                                        <tr>
                                                            <th>COLUMN</th>
                                                            <th>MEAN</th>
                                                            <th>MIN</th>
                                                            <th>MAX</th>
                                                            <th>STD DEV</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {report.executive_summary.kpis.map((kpi: any, i: number) => (
                                                            <tr key={i} className="font-mono">
                                                                <td className="font-bold text-foreground">{kpi.name}</td>
                                                                <td className="text-brand-primary font-bold">{kpi.mean?.toLocaleString()}</td>
                                                                <td className="text-brand-secondary">{kpi.min?.toLocaleString()}</td>
                                                                <td className="text-brand-secondary">{kpi.max?.toLocaleString()}</td>
                                                                <td className="text-brand-secondary">{kpi.std?.toLocaleString()}</td>
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
            )}
        </>
    );
}
