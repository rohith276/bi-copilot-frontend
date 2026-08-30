"use client";

import React, { useMemo } from 'react';
import { PaperTape, TechnicalBadge } from '../PaperAccents';

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

/* ── Numeric Histogram (pure CSS bars) ──────────────────────────── */
function NumericHistogram({ data, colName }: { data: any[]; colName: string }) {
    const bins = useMemo(() => {
        const values = data
            .map(row => row[colName])
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));

        if (values.length < 2) return [];

        const min = Math.min(...values);
        const max = Math.max(...values);
        if (min === max) return [{ label: formatNumber(min), count: values.length }];

        const binCount = 8;
        const binWidth = (max - min) / binCount;
        const counts = new Array(binCount).fill(0);

        for (const v of values) {
            const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
            counts[idx]++;
        }

        return counts.map((count, i) => ({
            label: formatNumber(min + i * binWidth),
            count,
        }));
    }, [data, colName]);

    if (bins.length === 0) return null;
    const maxCount = Math.max(...bins.map(b => b.count));

    return (
        <div className="flex items-end gap-px h-12 mt-2">
            {bins.map((bin, i) => (
                <div
                    key={i}
                    className="flex-1 bg-(--brand-primary) rounded-t opacity-60 hover:opacity-100 transition-opacity cursor-pointer relative group"
                    style={{ height: `${(bin.count / maxCount) * 100}%`, minHeight: bin.count > 0 ? '2px' : '0' }}
                    title={`${bin.label}: ${bin.count} rows`}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-(--foreground) text-(--background) text-[7px] font-mono px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {bin.count}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Categorical Top-5 Bars (pure CSS) ──────────────────────────── */
function CategoricalBars({ data, colName }: { data: any[]; colName: string }) {
    const topValues = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const row of data) {
            const val = row[colName];
            if (val == null || val === '') continue;
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
        }
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([value, count]) => ({ value, count }));
    }, [data, colName]);

    if (topValues.length === 0) return null;
    const maxCount = topValues[0]?.count || 1;

    const barColors = [
        'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'
    ];

    return (
        <div className="space-y-1 mt-2">
            {topValues.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="w-16 truncate text-right text-(--brand-secondary) shrink-0">{item.value}</span>
                    <div className="flex-1 h-3 bg-(--surface) rounded overflow-hidden border border-(--border-color)">
                        <div
                            className={`h-full rounded ${barColors[i] || 'bg-blue-500'} opacity-70`}
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                    </div>
                    <span className="w-8 text-right text-(--foreground) font-bold shrink-0">{item.count}</span>
                </div>
            ))}
        </div>
    );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function StatsTab({ stats, dataset, data }: StatsTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10 font-mono text-xs">
            {stats.map((stat, i) => {
                const isNumeric = stat.mean !== undefined;

                return (
                    <div key={i} className="paper-sheet p-5 relative overflow-hidden flex flex-col justify-between">
                        <PaperTape className={i % 2 === 0 ? "-left-2 top-2 -rotate-3" : "-right-2 top-2 rotate-3"} />
                        
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-(--foreground) text-sm uppercase tracking-wider truncate mr-2">{stat.name}</h3>
                                <TechnicalBadge 
                                    text={stat.type} 
                                    status={stat.type.includes('int') || stat.type.includes('float') ? 'blueprint' : 'success'} 
                                />
                            </div>

                            <div className="space-y-3">
                                {/* Completeness */}
                                <div className="flex justify-between items-center bg-(--surface) border border-(--border-color) p-2.5 rounded text-xs font-mono">
                                    <span className="text-(--brand-secondary) font-bold uppercase tracking-wider text-[10px]">COMPLETENESS</span>
                                    <span className="font-black text-(--brand-primary)">
                                        {((1 - stat.missing_values / (dataset?.row_count || data.length || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>

                                {/* Uniques & Nulls */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 bg-(--surface) rounded border border-(--border-color)">
                                        <p className="text-[9px] font-bold text-(--brand-secondary) uppercase tracking-wider mb-0.5">UNIQUES</p>
                                        <p className="font-black text-(--foreground) text-lg">{stat.unique_values}</p>
                                    </div>
                                    <div className="p-2.5 bg-(--surface) rounded border border-(--border-color)">
                                        <p className="text-[9px] font-bold text-(--brand-secondary) uppercase tracking-wider mb-0.5">NULLS</p>
                                        <p className={`font-black text-lg ${stat.missing_values > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {stat.missing_values}
                                        </p>
                                    </div>
                                </div>

                                {/* Distribution Mini-Chart */}
                                <div className="pt-2 border-t border-(--border-color)">
                                    <p className="text-[9px] font-bold text-(--brand-secondary) uppercase tracking-wider mb-0.5">
                                        {isNumeric ? 'DISTRIBUTION' : 'TOP VALUES'}
                                    </p>
                                    {isNumeric ? (
                                        <NumericHistogram data={data} colName={stat.name} />
                                    ) : (
                                        <CategoricalBars data={data} colName={stat.name} />
                                    )}
                                </div>

                                {/* Numeric Stats */}
                                {isNumeric && (
                                    <div className="pt-2 border-t border-(--border-color) space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[9px] font-bold text-(--brand-secondary) uppercase tracking-wider mb-0.5">Mean</p>
                                                <p className="font-black text-(--foreground) text-lg">{formatNumber(stat.mean)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-(--brand-secondary) uppercase tracking-wider mb-0.5">Median</p>
                                                <p className="font-black text-(--foreground) text-lg">{stat.median != null ? formatNumber(stat.median) : '—'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <div className="p-1.5 bg-(--surface) rounded border border-(--border-color) text-center">
                                                <p className="text-[8px] font-bold text-(--brand-secondary) uppercase">Min</p>
                                                <p className="font-bold text-(--foreground) text-xs">{formatNumber(stat.min)}</p>
                                            </div>
                                            <div className="p-1.5 bg-(--surface) rounded border border-(--border-color) text-center">
                                                <p className="text-[8px] font-bold text-(--brand-secondary) uppercase">Max</p>
                                                <p className="font-bold text-(--foreground) text-xs">{formatNumber(stat.max)}</p>
                                            </div>
                                            <div className="p-1.5 bg-(--surface) rounded border border-(--border-color) text-center">
                                                <p className="text-[8px] font-bold text-(--brand-secondary) uppercase">Std</p>
                                                <p className="font-bold text-(--foreground) text-xs">{stat.std != null ? formatNumber(stat.std) : '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
