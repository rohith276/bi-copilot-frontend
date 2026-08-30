"use client";

import React, { useState } from 'react';
import { PaperTape, TechnicalBadge } from '../PaperAccents';

interface IntelligenceTabProps {
    report: any;
    reportLoading: boolean;
    fetchReport: () => void;
}

/* ── Quality Score Ring ─────────────────────────────────────────── */
function QualityRing({ score, completeness, missing, duplicates }: { score: string; completeness: number; missing: number; duplicates: number }) {
    const gradeColors: Record<string, string> = {
        Excellent: '#10b981',
        Good: '#3b82f6',
        Fair: '#f59e0b',
        Poor: '#ef4444',
    };
    const color = gradeColors[score] || '#64748b';
    const pct = Math.min(completeness, 100);
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="8" opacity={0.3} />
                    <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black font-mono" style={{ color }}>{pct.toFixed(0)}%</span>
                    <span className="text-[8px] font-mono font-bold text-(--brand-secondary) uppercase tracking-wider">COMPLETE</span>
                </div>
            </div>
            <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black" style={{ color }}>{score}</span>
                    <TechnicalBadge text="QUALITY GRADE" status={score === 'Excellent' || score === 'Good' ? 'success' : 'blueprint'} />
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    <div className="bg-(--surface) border border-(--border-color) rounded p-2">
                        <span className="text-(--brand-secondary) uppercase block">Missing Cells</span>
                        <span className={`font-bold text-sm ${missing > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{missing.toLocaleString()}</span>
                    </div>
                    <div className="bg-(--surface) border border-(--border-color) rounded p-2">
                        <span className="text-(--brand-secondary) uppercase block">Duplicate Rows</span>
                        <span className={`font-bold text-sm ${duplicates > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{duplicates.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Missing Data Per-Column Bars ───────────────────────────────── */
function MissingDataBars({ columns }: { columns: { name: string; missing: number; total: number }[] }) {
    const sorted = [...columns].sort((a, b) => b.missing - a.missing).filter(c => c.missing > 0);
    if (sorted.length === 0) {
        return (
            <div className="text-center py-4 font-mono text-[10px] text-emerald-500 font-bold uppercase">
                ✓ No missing values detected in any column
            </div>
        );
    }

    const maxMissing = sorted[0]?.missing || 1;

    return (
        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {sorted.slice(0, 15).map(col => {
                const pct = (col.missing / col.total) * 100;
                const barWidth = (col.missing / maxMissing) * 100;
                return (
                    <div key={col.name} className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="w-28 truncate text-(--foreground) font-bold text-right shrink-0">{col.name}</span>
                        <div className="flex-1 h-4 bg-(--surface) border border-(--border-color) rounded overflow-hidden relative">
                            <div
                                className="h-full rounded transition-all duration-500"
                                style={{
                                    width: `${barWidth}%`,
                                    backgroundColor: pct > 20 ? '#ef4444' : pct > 5 ? '#f59e0b' : '#3b82f6',
                                }}
                            />
                        </div>
                        <span className="w-16 text-right text-(--brand-secondary) shrink-0">{col.missing} ({pct.toFixed(1)}%)</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Correlation Heatmap ────────────────────────────────────────── */
function CorrelationHeatmap({ correlation }: { correlation: { columns: string[]; matrix: number[][] } }) {
    const { columns, matrix } = correlation;
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; val: number } | null>(null);

    const getColor = (val: number | null) => {
        if (val == null) return 'transparent';
        // Blue for positive, Red for negative, White for zero
        if (val >= 0) {
            const intensity = Math.min(val, 1);
            return `rgba(37, 99, 235, ${intensity * 0.85})`;
        } else {
            const intensity = Math.min(Math.abs(val), 1);
            return `rgba(239, 68, 68, ${intensity * 0.85})`;
        }
    };

    const getTextColor = (val: number | null) => {
        if (val == null) return 'transparent';
        return Math.abs(val) > 0.5 ? '#ffffff' : 'var(--foreground)';
    };

    return (
        <div className="overflow-x-auto custom-scrollbar">
            {hoveredCell && (
                <div className="mb-2 font-mono text-[10px] text-(--brand-secondary)">
                    <span className="font-bold text-(--foreground)">{columns[hoveredCell.row]}</span>
                    {' ↔ '}
                    <span className="font-bold text-(--foreground)">{columns[hoveredCell.col]}</span>
                    {' = '}
                    <span className={`font-black ${hoveredCell.val > 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                        {hoveredCell.val?.toFixed(3)}
                    </span>
                </div>
            )}
            <div className="inline-block">
                {/* Column headers */}
                <div className="flex" style={{ paddingLeft: '7rem' }}>
                    {columns.map((col, i) => (
                        <div key={i} className="font-mono text-[8px] text-(--brand-secondary) font-bold uppercase tracking-wider" style={{ width: '2.5rem', textAlign: 'center' }}>
                            <div className="truncate -rotate-45 origin-bottom-left translate-y-2 w-16">{col}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-8">
                    {matrix.map((row, i) => (
                        <div key={i} className="flex items-center">
                            <span className="font-mono text-[9px] text-(--foreground) font-bold w-28 truncate text-right pr-2 shrink-0">{columns[i]}</span>
                            {row.map((val, j) => (
                                <div
                                    key={j}
                                    className="border border-(--background)/50 transition-transform hover:scale-110 hover:z-10 cursor-pointer relative"
                                    style={{
                                        width: '2.5rem',
                                        height: '1.5rem',
                                        backgroundColor: getColor(val),
                                    }}
                                    onMouseEnter={() => setHoveredCell({ row: i, col: j, val })}
                                    onMouseLeave={() => setHoveredCell(null)}
                                >
                                    <span
                                        className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold"
                                        style={{ color: getTextColor(val) }}
                                    >
                                        {val != null ? val.toFixed(1) : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mt-4 font-mono text-[9px] text-(--brand-secondary)">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.85)' }} />
                        <span>-1.0 (Negative)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded border border-(--border-color)" />
                        <span>0 (None)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(37, 99, 235, 0.85)' }} />
                        <span>+1.0 (Positive)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function IntelligenceTab({ report, reportLoading, fetchReport }: IntelligenceTabProps) {
    if (!report && !reportLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center font-mono text-xs">
                <div className="w-16 h-16 bg-(--surface) border border-(--border-color) rounded flex items-center justify-center text-3xl mb-4 text-(--brand-primary)">🌩️</div>
                <h2 className="text-base font-bold text-(--foreground) uppercase tracking-wider mb-2">INITIALIZE INTELLIGENCE SCAN ENGINE</h2>
                <p className="text-(--brand-secondary) max-w-md mx-auto text-xs mb-6">Execute a deep statistical scan including KPI clusters, correlation matrix, data quality grading, and anomaly flags.</p>
                <button
                    onClick={fetchReport}
                    className="saas-button saas-button-primary font-mono text-xs uppercase tracking-wider"
                >
                    Run Deep Scan →
                </button>
            </div>
        );
    }

    if (reportLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 font-mono text-xs">
                <svg className="animate-spin w-8 h-8 text-(--brand-primary)" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-(--brand-secondary) font-bold uppercase tracking-wider">COMPUTING DEEP STATISTICAL MATRIX...</p>
            </div>
        );
    }

    // Build missing data info from column insights
    const missingColumns = (report.column_insights || []).map((col: any) => ({
        name: col.name,
        missing: col.missing_values || 0,
        total: report.dataset?.rows || 1,
    }));

    return (
        <div className="space-y-6 font-mono text-xs pb-8">
            {/* Report Toolbar */}
            <div className="paper-sheet p-4 flex justify-between items-center relative overflow-hidden">
                <PaperTape className="right-4 top-2 rotate-2" />
                <div className="flex items-center gap-3">
                    <TechnicalBadge text="INTELLIGENCE REPORT" status="blueprint" />
                    <span className="text-(--brand-secondary) font-bold">{report.dataset?.rows?.toLocaleString()} rows × {report.dataset?.columns} cols</span>
                    <span className="text-(--brand-secondary)">|</span>
                    <span className="text-(--brand-secondary)">{new Date(report.generated_at).toLocaleTimeString()}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="saas-button saas-button-primary text-xs font-mono uppercase">🖨 Print</button>
                    <button onClick={fetchReport} className="saas-button saas-button-secondary text-xs font-mono uppercase">Re-Scan</button>
                </div>
            </div>

            {/* Data Quality + Missing Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="paper-sheet p-5">
                    <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-4 border-b border-(--border-color) pb-2">
                        Data Quality Grade
                    </h3>
                    <QualityRing
                        score={report.data_quality?.quality_score || 'Unknown'}
                        completeness={report.data_quality?.completeness_pct || 0}
                        missing={report.data_quality?.missing_cells || 0}
                        duplicates={report.data_quality?.duplicate_rows || 0}
                    />
                </div>
                <div className="paper-sheet p-5">
                    <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-4 border-b border-(--border-color) pb-2">
                        Missing Data by Column
                    </h3>
                    <MissingDataBars columns={missingColumns} />
                </div>
            </div>

            {/* Top Insights */}
            <div>
                <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-3">Auto-Generated Insights</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {report.top_insights.map((ins: any, i: number) => (
                        <div key={i} className="paper-sheet p-4 flex gap-3">
                            <span className="text-xl">{ins.icon}</span>
                            <div>
                                <p className="font-bold text-(--foreground) text-xs uppercase tracking-wider mb-1">{ins.title}</p>
                                <p className="text-[11px] text-(--brand-secondary) leading-relaxed">{ins.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* KPI Table */}
            <div>
                <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-3">Discovery Metrics Ledger</h3>
                <div className="paper-sheet overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="saas-table text-xs">
                            <thead>
                                <tr>
                                    <th>Dimension</th>
                                    <th>Mean</th>
                                    <th>Median</th>
                                    <th>Range (Min / Max)</th>
                                    <th>Std Dev</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.executive_summary?.kpis?.map((kpi: any, j: number) => (
                                    <tr key={j} className="font-mono">
                                        <td className="font-bold text-(--foreground)">{kpi.name}</td>
                                        <td className="text-(--brand-primary) font-bold">{kpi.mean?.toFixed(2)}</td>
                                        <td className="font-bold">{kpi.median?.toFixed(2) ?? '—'}</td>
                                        <td className="text-(--brand-secondary)">{kpi.min?.toFixed(1)} — {kpi.max?.toFixed(1)}</td>
                                        <td className="text-(--brand-secondary)">{kpi.std?.toFixed(2) ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Correlation Heatmap */}
            {report.correlation && (
                <div>
                    <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-3">Correlation Matrix Heatmap</h3>
                    <div className="paper-sheet p-5">
                        <CorrelationHeatmap correlation={report.correlation} />
                    </div>
                </div>
            )}
        </div>
    );
}
