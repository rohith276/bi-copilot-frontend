"use client";

import React from 'react';

interface IntelligenceTabProps {
    report: any;
    reportLoading: boolean;
    fetchReport: () => void;
}

export default function IntelligenceTab({ report, reportLoading, fetchReport }: IntelligenceTabProps) {
    if (!report && !reportLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-indigo-600/10 rounded-full flex items-center justify-center text-5xl mb-6">🌩️</div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Initialize Intelligence Engine</h2>
                <p className="text-slate-500 max-w-md mx-auto text-sm mb-10 font-medium">Generate a deep architectural analysis of this dataset including anomaly detection, KPI clusters, and strategic executive recommendations.</p>
                <button
                    onClick={fetchReport}
                    className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all glow-primary"
                >
                    Run Deep Scan
                </button>
            </div>
        );
    }

    if (reportLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-8">
                <div className="relative">
                    <div className="w-20 h-20 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-20 h-20 border-[6px] border-transparent border-b-pink-500 rounded-full animate-spin [animation-duration:2s]"></div>
                </div>
                <div className="text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Decompressing Data Matrix...</p>
                    <p className="text-[10px] text-slate-500 mt-3 font-bold">Scanning for anomalies and emergent patterns</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[40px] p-1 shadow-2xl overflow-hidden border border-slate-200 dark:border-white/5">
            <div className="flex bg-white dark:bg-slate-800 rounded-[38px] overflow-hidden flex-col">
                {/* Report Toolbar */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg tracking-widest">Active Report</div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dataset Quality: {report.data_quality?.quality_score}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Export PDF</button>
                        <button onClick={fetchReport} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Re-Scan</button>
                    </div>
                </div>
                {/* Embedded Report Content (Simplified Scrollable) */}
                <div className="p-10 space-y-10 max-h-[1000px] overflow-y-auto custom-scrollbar">
                    {/* Metadata */}
                    <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Rows: {report.dataset?.rows}</span>
                        <span>·</span>
                        <span>Cols: {report.dataset?.columns}</span>
                        <span>·</span>
                        <span>Time: {new Date(report.generated_at).toLocaleTimeString()}</span>
                    </div>

                    {/* Insights */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {report.top_insights.map((ins: any, i: number) => (
                            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex gap-4">
                                    <span className="text-2xl">{ins.icon}</span>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-tight">{ins.title}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{ins.body}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Summary */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Discovery Metrics</h3>
                        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5">
                            <table className="w-full text-[10px]">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Dimension</th>
                                        <th className="px-4 py-3 text-left">Mean</th>
                                        <th className="px-4 py-3 text-left">Median</th>
                                        <th className="px-4 py-3 text-left">Range (Min/Max)</th>
                                        <th className="px-4 py-3 text-left">Std Dev</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {report.executive_summary?.kpis?.map((kpi: any, j: number) => (
                                        <tr key={j} className="bg-white dark:bg-slate-800">
                                            <td className="px-4 py-3 font-black text-slate-700 dark:text-white">{kpi.name}</td>
                                            <td className="px-4 py-3 text-indigo-600 font-black">{kpi.mean?.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-purple-600 dark:text-purple-400 font-black">{kpi.median?.toFixed(2) ?? '—'}</td>
                                            <td className="px-4 py-3 text-slate-400 font-bold">{kpi.min?.toFixed(1)} — {kpi.max?.toFixed(1)}</td>
                                            <td className="px-4 py-3 text-slate-500 font-bold">{kpi.std?.toFixed(2) ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Correlation Matrix */}
                    {report.correlation && (
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Correlation Matrix</h3>
                            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/5">
                                <table className="w-full text-[9px]">
                                    <thead className="bg-slate-900 text-white">
                                        <tr>
                                            <th className="px-3 py-2 text-left"></th>
                                            {report.correlation.columns.map((col: string) => (
                                                <th key={col} className="px-3 py-2 text-center font-black uppercase tracking-wider whitespace-nowrap">{col.length > 12 ? col.slice(0, 12) + '…' : col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.correlation.matrix.map((row: number[], i: number) => (
                                            <tr key={i} className="border-t border-slate-100 dark:border-white/5">
                                                <td className="px-3 py-2 font-black text-slate-700 dark:text-white whitespace-nowrap">{report.correlation.columns[i].length > 12 ? report.correlation.columns[i].slice(0, 12) + '…' : report.correlation.columns[i]}</td>
                                                {row.map((val: number, j: number) => {
                                                    const absVal = Math.abs(val ?? 0);
                                                    const bg = val == null ? '' : val > 0 ? `rgba(34,197,94,${absVal * 0.4})` : `rgba(239,68,68,${absVal * 0.4})`;
                                                    return (
                                                        <td key={j} className="px-3 py-2 text-center font-bold" style={{ backgroundColor: i === j ? 'transparent' : bg }}>
                                                            {i === j ? <span className="text-slate-300">1.00</span> : <span className={absVal > 0.5 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>{val?.toFixed(2) ?? '—'}</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-2 font-medium">🟢 Green = positive correlation | 🔴 Red = negative correlation | Stronger color = stronger relationship</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
