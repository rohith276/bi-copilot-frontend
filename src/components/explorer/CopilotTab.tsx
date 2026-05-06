"use client";

import React from 'react';

interface CopilotTabProps {
    nlQuery: string;
    setNlQuery: (query: string) => void;
    handleNLQuery: (e: React.FormEvent) => void;
    nlLoading: boolean;
    suggestions: string[];
    nlResponse: any;
}

export default function CopilotTab({
    nlQuery,
    setNlQuery,
    handleNLQuery,
    nlLoading,
    suggestions,
    nlResponse
}: CopilotTabProps) {
    return (
        <div className="flex flex-col h-full gap-6">
            {/* Input Form */}
            <form onSubmit={handleNLQuery} className="relative w-full max-w-6xl mx-auto">
                <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-indigo-100 dark:border-slate-700 p-2 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-300">
                    <div className="pl-4 text-indigo-500">
                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <input
                        type="text"
                        value={nlQuery}
                        onChange={(e) => setNlQuery(e.target.value)}
                        placeholder="Ask a question about this data... e.g. 'Show sales trend for last 6 months'"
                        className="w-full bg-transparent border-none text-slate-900 dark:text-white px-4 py-3 focus:outline-none placeholder-slate-400 font-medium"
                        disabled={nlLoading}
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        disabled={nlLoading || !nlQuery.trim()}
                    >
                        {nlLoading ? 'Processing...' : 'Run Query'}
                    </button>
                </div>
            </form>

            {/* Suggestions */}
            {suggestions.length > 0 && !nlResponse && (
                <div className="max-w-6xl mx-auto w-full flex flex-wrap gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-700">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2.5 mr-2">Try asking:</span>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => { setNlQuery(s); }}
                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
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
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-[32px] p-8 border border-indigo-100 dark:border-indigo-500/20 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                            <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] mb-4">AI Insight</h4>
                            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{nlResponse.insights}</p>
                        </div>
                        <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-700 shadow-xl animate-in fade-in slide-in-from-bottom-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex justify-between">
                                <span>Generated SQL</span>
                                <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded font-mono">SQLite</span>
                            </h4>
                            <pre className="text-emerald-400 font-mono text-[11px] overflow-auto whitespace-pre-wrap"><code className="language-sql">{nlResponse.sql_query}</code></pre>
                        </div>
                    </div>
                    <div className="lg:w-2/3 bg-white dark:bg-slate-800 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-8 flex flex-col max-h-[400px]">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-black text-xs text-slate-500 uppercase tracking-widest">
                            Data Result Set <span className="text-indigo-500 ml-2">({nlResponse.result.total_rows} Rows)</span>
                        </div>
                        <div className="overflow-auto p-0">
                            {nlResponse.result.data && nlResponse.result.data.length > 0 ? (
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                                        <tr>
                                            {nlResponse.result.columns.map((col: string) => (
                                                <th key={col} className="px-6 py-4 font-black uppercase tracking-widest whitespace-nowrap">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {nlResponse.result.data.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                {nlResponse.result.columns.map((col: string) => (
                                                    <td key={col} className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                                        {row[col] == null ? <span className="text-pink-400 italic font-black">NULL</span> : typeof row[col] === 'number' ? (Number.isInteger(row[col]) ? row[col].toLocaleString() : Number(row[col]).toFixed(2)) : String(row[col])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-slate-400 font-bold">Query returned zero rows</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
