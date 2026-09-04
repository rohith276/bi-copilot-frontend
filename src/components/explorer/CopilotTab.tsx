"use client";

import React from 'react';
import { PaperTape, TechnicalBadge } from '../PaperAccents';
import { useToast } from '../Toast';
import { useVoiceInput } from '@/hooks/useVoiceInput';

function exportToCSV(columns: string[], data: any[], filename: string) {
    const header = columns.join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const val = row[col];
            if (val == null) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

interface CopilotTabProps {
    datasetId: number;
    nlQuery: string;
    setNlQuery: (query: string) => void;
    handleNLQuery: (e: React.FormEvent) => void;
    nlLoading: boolean;
    suggestions: string[];
    nlResponse: any;
}

export default function CopilotTab({
    datasetId,
    nlQuery,
    setNlQuery,
    handleNLQuery,
    nlLoading,
    suggestions,
    nlResponse
}: CopilotTabProps) {
    const { addToast } = useToast();
    const { isListening, isSupported, toggleListening } = useVoiceInput((transcript) => {
        setNlQuery(transcript);
        addToast('Voice captured — press Run Query', 'success');
    });

    const handlePin = async () => {
        if (!nlResponse) return;
        try {
            const { apiFetch } = await import('@/lib/api');
            await apiFetch(`/dashboards/${datasetId}/pin`, {
                method: "POST",
                body: JSON.stringify({
                    title: nlQuery || "AI Insight Query",
                    sql_query: nlResponse.sql_query,
                    chart_config: nlResponse.chart_config || { type: 'none' },
                    layout: { w: 6, h: 4, x: 0, y: 0 }
                })
            });
            addToast('Insight pinned to dashboard successfully!', 'success');
        } catch (e) {
            console.error("Failed to pin", e);
            addToast('Failed to pin insight to dashboard', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Input Form */}
            <form onSubmit={handleNLQuery} className="relative w-full max-w-6xl mx-auto">
                <div className="paper-sheet p-2 flex items-center gap-3 relative overflow-hidden">
                    <PaperTape className="left-4 top-1 -rotate-2" />
                    <div className="pl-3 text-brand-primary font-mono text-xs font-bold">
                        SQL&gt;
                    </div>
                    <input
                        type="text"
                        value={nlQuery}
                        onChange={(e) => setNlQuery(e.target.value)}
                        placeholder="Ask a question about this dataset... e.g. 'Why did sales drop?'"
                        className="w-full bg-transparent border-none text-foreground px-2 py-2 focus:outline-none placeholder-brand-secondary font-mono text-xs"
                        disabled={nlLoading}
                    />
                    {isSupported && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`shrink-0 w-8 h-8 rounded flex items-center justify-center transition-colors ${
                                isListening
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'bg-(--surface-hover) text-(--brand-secondary) hover:text-(--foreground) border border-(--border-color)'
                            }`}
                            title={isListening ? 'Listening...' : 'Voice input'}
                        >
                            🎤
                        </button>
                    )}
                    <button
                        type="submit"
                        className="saas-button saas-button-primary font-mono text-xs uppercase tracking-wider shrink-0"
                        disabled={nlLoading}
                    >
                        {nlLoading ? 'Processing...' : 'Run Query →'}
                    </button>
                </div>
            </form>

            {/* Suggestions */}
            {suggestions.length > 0 && !nlResponse && (
                <div className="max-w-6xl mx-auto w-full flex flex-wrap gap-2.5 mt-1 font-mono text-xs">
                    <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest pt-1.5 mr-1">SUGGESTED SPECS:</span>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => { setNlQuery(s); }}
                            className="px-3 py-1.5 bg-surface-200 border border-border-color rounded text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Response Area */}
            {nlResponse && (
                <div className="flex gap-6 max-w-6xl mx-auto w-full flex-col lg:flex-row h-full">
                    <div className="flex flex-col gap-6 lg:w-1/3">
                        <div className="paper-sheet p-6 relative overflow-hidden font-mono text-xs">
                            <PaperTape className="-right-2 top-2 rotate-3" />
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-bold uppercase text-brand-secondary tracking-widest">
                                    {nlResponse.rootCause ? 'ROOT-CAUSE ANALYSIS' : 'AI INSIGHT SPECIFICATION'}
                                </h4>
                                <TechnicalBadge text={nlResponse.rootCause ? 'RCA' : 'ANALYSIS'} status="blueprint" />
                            </div>
                            <p className="text-foreground leading-relaxed">{nlResponse.insights}</p>

                            {nlResponse.rootCause && (
                                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px]">
                                    <div className="bg-(--surface) border border-(--border-color) rounded p-2">
                                        <span className="text-(--brand-secondary) uppercase block">Prior</span>
                                        <span className="font-bold">{nlResponse.rootCause.prior_total?.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-(--surface) border border-(--border-color) rounded p-2">
                                        <span className="text-(--brand-secondary) uppercase block">Recent</span>
                                        <span className="font-bold">{nlResponse.rootCause.recent_total?.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-4 pt-4 border-t border-border-color">
                                <button onClick={handlePin} className="w-full saas-button saas-button-secondary uppercase tracking-wider text-[10px] py-2">
                                    📌 Pin to Executive Dashboard
                                </button>
                            </div>
                        </div>
                        <div className="paper-sheet p-6 bg-surface-200 border border-border-color font-mono text-xs">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-bold uppercase text-brand-secondary tracking-widest">GENERATED SQL</h4>
                                <TechnicalBadge text="DUCKDB" status="success" />
                            </div>
                            <pre className="text-brand-primary font-mono text-xs overflow-auto whitespace-pre-wrap bg-surface-100 p-3 rounded border border-border-color"><code>{nlResponse.sql_query}</code></pre>
                        </div>
                    </div>

                    <div className="lg:w-2/3 paper-sheet overflow-hidden flex flex-col max-h-112.5">
                        <div className="p-3 bg-surface-200 border-b border-border-color font-mono text-xs font-bold text-foreground uppercase tracking-widest flex items-center justify-between">
                            <span>RESULT SET LEDGER</span>
                            <div className="flex items-center gap-2">
                                <TechnicalBadge text={`${nlResponse.result.total_rows} ROWS`} status="blueprint" />
                                {nlResponse.result.data && nlResponse.result.data.length > 0 && (
                                    <button
                                        onClick={() => {
                                            exportToCSV(nlResponse.result.columns, nlResponse.result.data, `ai_query_export_${new Date().toISOString().slice(0, 10)}.csv`);
                                            addToast(`Exported ${nlResponse.result.data.length} rows as CSV`, 'success');
                                        }}
                                        className="bg-(--brand-primary) text-white font-mono text-[9px] px-2 py-1 rounded hover:opacity-90 transition-opacity uppercase tracking-wider flex items-center gap-1"
                                    >
                                        ⬇ CSV
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="overflow-auto p-0 flex-1">
                            {nlResponse.result.data && nlResponse.result.data.length > 0 ? (
                                <table className="saas-table whitespace-nowrap">
                                    <thead>
                                        <tr>
                                            {nlResponse.result.columns.map((col: string) => (
                                                <th key={col} className="bg-surface-200 text-xs font-mono font-bold text-brand-secondary">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nlResponse.result.data.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-surface-200">
                                                {nlResponse.result.columns.map((col: string) => (
                                                    <td key={col} className="font-mono text-xs text-foreground">
                                                        {row[col] == null ? <span className="text-status-warning italic font-bold">NULL</span> : typeof row[col] === 'number' ? (Number.isInteger(row[col]) ? row[col].toLocaleString() : Number(row[col]).toFixed(2)) : String(row[col])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-brand-secondary font-mono text-xs">Query returned zero rows</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
