"use client";

import React from 'react';

interface StatsTabProps {
    stats: any[];
    dataset: any;
    data: any[];
}

function formatNumber(val: number): string {
    if (val == null || isNaN(val)) return '—';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return (val / 1_000).toFixed(1) + 'K';
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toFixed(2);
}

export default function StatsTab({ stats, dataset, data }: StatsTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {stats.map((stat, i) => (
                <div key={i} className="p-8 rounded-[32px] border-2 border-indigo-500/40 dark:border-indigo-400/30 bg-white/50 dark:bg-slate-800/80 backdrop-blur-xl hover:bg-white/80 hover:border-indigo-500 hover:shadow-[0_24px_48px_-12px_rgba(79,70,229,0.3)] hover:scale-[1.03] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden shadow-md shadow-indigo-500/10">
                    <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-all duration-500 group-hover:opacity-30 ${stat.type.includes('int') || stat.type.includes('float') ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}></div>
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase truncate">{stat.name}</h3>
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase shadow-lg transition-all duration-500 group-hover:scale-110 ${stat.type.includes('int') || stat.type.includes('float')
                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                            : 'bg-indigo-600 text-white shadow-indigo-200'
                            }`}>
                            {stat.type}
                        </span>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-center bg-white/80 border border-slate-200 dark:border-slate-700 dark:bg-slate-900/80 p-4 rounded-2xl shadow-sm">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Discovery Rate</span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                {((1 - stat.missing_values / (dataset?.row_count || data.length || 1)) * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-white/90 transition-colors shadow-sm">
                                <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Uniques</p>
                                <p className="font-black text-slate-900 dark:text-white text-3xl tracking-tighter">{stat.unique_values}</p>
                            </div>
                            <div className="p-5 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-white/90 transition-colors shadow-sm">
                                <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Null Vectors</p>
                                <p className={`font-black text-3xl tracking-tighter ${stat.missing_values > 0 ? 'text-pink-600 dark:text-pink-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {stat.missing_values}
                                </p>
                            </div>
                        </div>

                        {(stat.mean !== undefined) && (
                            <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Mean
                                        </p>
                                        <p className="font-black text-slate-900 dark:text-white text-3xl tracking-tighter">{formatNumber(stat.mean)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Median
                                        </p>
                                        <p className="font-black text-slate-900 dark:text-white text-3xl tracking-tighter">{stat.median != null ? formatNumber(stat.median) : '—'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="p-4 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Min</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-2xl tracking-tight">{formatNumber(stat.min)}</p>
                                    </div>
                                    <div className="p-4 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Max</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-2xl tracking-tight">{formatNumber(stat.max)}</p>
                                    </div>
                                    <div className="p-4 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Std Dev</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-2xl tracking-tight">{stat.std != null ? formatNumber(stat.std) : '—'}</p>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
