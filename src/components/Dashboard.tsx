"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { apiFetch } from '@/lib/api';
import Visualizer from './Visualizer';
import { PaperTape, TechnicalBadge, IsometricDatabase } from './PaperAccents';
import Link from 'next/link';

interface DashboardProps {
    datasetId: number;
}

interface DashboardItem {
    id: number;
    title: string;
    sql_query: string;
    chart_config: any;
    layout: any;
}

export default function Dashboard({ datasetId }: DashboardProps) {
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<Record<number, any[]>>({});
    const [expandedSql, setExpandedSql] = useState<number | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<{ column: string; value: string } | null>(null);
    const { addToast } = useToast();

    const loadDashboard = async () => {
        try {
            const data = await apiFetch(`/dashboards/${datasetId}`);
            setItems(data);
            
            const results: Record<number, any[]> = {};
            for (const item of data) {
                try {
                    const res = await apiFetch(`/datasets/${datasetId}/query`, {
                        method: 'POST',
                        body: JSON.stringify({ sql_query: item.sql_query, limit: 500 })
                    });
                    results[item.id] = res.data || [];
                } catch {
                    results[item.id] = [];
                }
            }
            setChartData(results);
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to load dashboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDashboard();
    }, [datasetId]);

    // Re-query all cards when cross-filter changes
    useEffect(() => {
        if (items.length === 0) return;
        const requery = async () => {
            const results: Record<number, any[]> = {};
            for (const item of items) {
                try {
                    let sql = item.sql_query;
                    if (activeFilter) {
                        const clause = `"${activeFilter.column}" = '${activeFilter.value.replace(/'/g, "''")}'`;
                        if (sql.includes('WHERE')) {
                            sql = sql.replace('WHERE', `WHERE ${clause} AND`);
                        } else if (sql.includes('GROUP BY')) {
                            sql = sql.replace('GROUP BY', `WHERE ${clause} GROUP BY`);
                        }
                    }
                    const res = await apiFetch(`/datasets/${datasetId}/query`, {
                        method: 'POST',
                        body: JSON.stringify({ sql_query: sql, limit: 500 })
                    });
                    results[item.id] = res.data || [];
                } catch {
                    results[item.id] = [];
                }
            }
            setChartData(results);
        };
        void requery();
    }, [activeFilter]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
        addToast('Dashboard refreshed', 'success');
    };

    const handleDelete = async (itemId: number) => {
        try {
            await apiFetch(`/dashboards/${datasetId}/items/${itemId}`, {
                method: 'DELETE'
            });
            setItems(prev => prev.filter(i => i.id !== itemId));
            setChartData(prev => {
                const next = { ...prev };
                delete next[itemId];
                return next;
            });
            addToast('Chart removed from dashboard', 'success');
        } catch (e) {
            addToast('Failed to remove chart', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-75 paper-sheet p-8 font-mono text-xs">
                <svg className="animate-spin w-8 h-8 text-(--brand-primary) mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-(--brand-secondary) font-bold uppercase tracking-wider">LOADING PINNED METRICS & CHARTS...</span>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100 paper-sheet p-8 text-center border-dashed border-2 border-(--border-color) bg-(--surface)/50">
                <IsometricDatabase className="w-24 h-24 text-(--border-color) mb-6" />
                <h3 className="font-mono font-bold text-lg text-(--foreground) mb-2 uppercase tracking-widest">Dashboard is Empty</h3>
                <p className="font-mono text-xs text-(--brand-secondary) max-w-md mb-6">
                    You haven&apos;t pinned any AI insights or visual queries to this dashboard yet.
                </p>
                <Link href={`/explore/${datasetId}?view=builder`} className="saas-button saas-button-primary font-mono text-xs uppercase tracking-wider">
                    Open Visual Builder →
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Strip */}
            <div className="paper-sheet p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TechnicalBadge text={`${items.length} CHARTS`} status="success" />
                    <span className="font-mono text-[10px] text-(--brand-secondary) uppercase tracking-wider">
                        Pinned Analytics Panels
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="font-mono text-[10px] text-(--brand-secondary) hover:text-(--foreground) uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                        <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const res = await apiFetch(`/dashboards/${datasetId}/share`, { method: 'POST' });
                                const url = `${window.location.origin}${res.url}`;
                                await navigator.clipboard.writeText(url);
                                addToast(`Share link copied: ${url}`, 'success');
                            } catch {
                                addToast('Failed to generate share link', 'error');
                            }
                        }}
                        className="font-mono text-[10px] text-(--brand-secondary) hover:text-(--foreground) uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                    </button>
                    <Link 
                        href={`/explore/${datasetId}?view=builder`} 
                        className="font-mono text-[10px] text-(--brand-primary) hover:underline uppercase tracking-wider"
                    >
                        + Add New Chart
                    </Link>
                </div>
            </div>

            {/* Cross-filter Badge */}
            {activeFilter && (
                <div className="paper-sheet p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="text-(--brand-secondary) uppercase tracking-wider">Active Filter:</span>
                        <span className="bg-(--brand-primary)/10 text-(--brand-primary) border border-(--brand-primary)/30 px-2 py-0.5 rounded font-bold">
                            {activeFilter.column} = &quot;{activeFilter.value}&quot;
                        </span>
                    </div>
                    <button
                        onClick={() => setActiveFilter(null)}
                        className="text-rose-500 hover:text-rose-600 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1"
                    >
                        <span>×</span> Clear Filter
                    </button>
                </div>
            )}

            {/* Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {items.map((item, index) => (
                    <div key={item.id} className={`paper-sheet p-0 relative overflow-hidden flex flex-col group transition-all duration-300 ${expandedCard === item.id ? 'lg:col-span-2' : ''}`}>
                        <PaperTape className={index % 2 === 0 ? "-left-2 top-2 -rotate-3" : "-right-2 top-2 rotate-3"} />
                        
                        {/* Card Header */}
                        <div className="flex items-center justify-between border-b border-(--border-color) px-4 py-3 mt-1">
                            <h3 className="text-[11px] font-mono font-bold text-(--foreground) uppercase tracking-widest truncate pr-4">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <TechnicalBadge 
                                    text={(item.chart_config.type || 'bar').toUpperCase()} 
                                    status="blueprint" 
                                />
                                <button
                                    onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-(--brand-secondary) hover:text-(--foreground) p-1"
                                    title={expandedCard === item.id ? 'Collapse' : 'Expand full width'}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {expandedCard === item.id ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                        )}
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-(--brand-secondary) hover:text-rose-500 p-1"
                                    title="Remove from dashboard"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Chart Area */}
                        <div className={`w-full px-4 py-3 flex-1 ${expandedCard === item.id ? 'h-96' : 'h-72'}`}>
                            {chartData[item.id] && chartData[item.id].length > 0 ? (
                                <Visualizer
                                    type={item.chart_config.type || 'bar'}
                                    data={chartData[item.id]}
                                    labelKey={item.chart_config.labelCol || item.chart_config.labelKey || ''}
                                    valueKey={item.chart_config.valueCol || item.chart_config.valueKey || ''}
                                    title={item.title}
                                    onDrillDown={(label) => {
                                        const labelCol = item.chart_config.labelCol || item.chart_config.labelKey || '';
                                        if (labelCol) {
                                            setActiveFilter({ column: labelCol, value: label });
                                        }
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center font-mono text-xs text-(--brand-secondary)">
                                    {chartData[item.id] ? 'No data returned' : (
                                        <span className="animate-pulse">Loading data...</span>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* SQL Footer */}
                        <div 
                            className="border-t border-(--border-color) bg-(--surface-hover)/30 px-4 py-2 cursor-pointer hover:bg-(--surface-hover)/60 transition-colors"
                            onClick={() => setExpandedSql(expandedSql === item.id ? null : item.id)}
                        >
                            <code className={`text-[9px] font-mono text-(--brand-secondary) block ${expandedSql === item.id ? 'whitespace-pre-wrap' : 'truncate'}`} title={item.sql_query}>
                                <span className="text-(--brand-primary) font-bold mr-1">SQL▸</span>
                                {item.sql_query}
                            </code>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
