"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Visualizer from '@/components/Visualizer';
import { TechnicalBadge } from '@/components/PaperAccents';

interface SharedItem {
    id: number;
    title: string;
    sql_query: string;
    chart_config: any;
    data: any[];
}

interface SharedDashboard {
    dataset: { id: number; filename: string };
    items: SharedItem[];
}

export default function SharedDashboardPage() {
    const params = useParams();
    const uuid = params?.uuid as string;
    const [dashboard, setDashboard] = useState<SharedDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!uuid) return;
        const fetchDashboard = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/shared/${uuid}`);
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.detail || 'Shared dashboard not found');
                }
                const data = await res.json();
                setDashboard(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load shared dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [uuid]);

    if (loading) {
        return (
            <div className="min-h-screen bg-(--background) flex items-center justify-center">
                <div className="text-center font-mono text-xs">
                    <svg className="animate-spin w-8 h-8 text-(--brand-primary) mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-(--brand-secondary) uppercase tracking-wider font-bold">Loading shared dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !dashboard) {
        return (
            <div className="min-h-screen bg-(--background) flex items-center justify-center">
                <div className="paper-sheet p-8 text-center max-w-md">
                    <div className="text-4xl mb-4">🔒</div>
                    <h1 className="font-mono font-bold text-lg text-(--foreground) mb-2 uppercase tracking-wider">Link Not Found</h1>
                    <p className="font-mono text-xs text-(--brand-secondary)">{error || 'This shared dashboard link is invalid or has been revoked.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-(--background) p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="paper-sheet p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="font-mono font-bold text-sm text-(--foreground) uppercase tracking-widest">
                            📊 {dashboard.dataset.filename}
                        </h1>
                        <TechnicalBadge text={`${dashboard.items.length} CHARTS`} status="success" />
                        <TechnicalBadge text="SHARED VIEW" status="blueprint" />
                    </div>
                    <span className="font-mono text-[10px] text-(--brand-secondary)">Powered by BI Copilot</span>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {dashboard.items.map(item => (
                        <div key={item.id} className="paper-sheet p-0 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between border-b border-(--border-color) px-4 py-3">
                                <h3 className="text-[11px] font-mono font-bold text-(--foreground) uppercase tracking-widest truncate">
                                    {item.title}
                                </h3>
                                <TechnicalBadge 
                                    text={(item.chart_config.type || 'bar').toUpperCase()} 
                                    status="blueprint" 
                                />
                            </div>
                            <div className="h-72 w-full px-4 py-3">
                                {item.data && item.data.length > 0 ? (
                                    <Visualizer
                                        type={item.chart_config.type || 'bar'}
                                        data={item.data}
                                        labelKey={item.chart_config.labelCol || item.chart_config.labelKey || ''}
                                        valueKey={item.chart_config.valueCol || item.chart_config.valueKey || ''}
                                        title={item.title}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center font-mono text-xs text-(--brand-secondary)">
                                        No data returned
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
