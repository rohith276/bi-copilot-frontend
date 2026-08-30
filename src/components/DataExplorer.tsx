"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { apiFetch } from '@/lib/api';
import { TechnicalBadge } from './PaperAccents';
import { useRouter } from 'next/navigation';

interface DataExplorerProps {
    datasetId: number;
}

interface ColumnMeta {
    name: string;
    type: string;
    missing_count: number;
    unique_count: number;
}

interface ProcessedDataPreview {
    columns: string[];
    sample_data: Record<string, unknown>[];
    metadata: {
        total_rows: number;
        column_details: ColumnMeta[];
    };
}

export default function DataExplorer({ datasetId }: DataExplorerProps) {
    const [data, setData] = useState<ProcessedDataPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [fileMissing, setFileMissing] = useState(false);
    const [repairing, setRepairing] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'schema' | 'quality'>('preview');
    const { addToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [previewRes, statsRes] = await Promise.all([
                    apiFetch(`/datasets/${datasetId}/preview`),
                    apiFetch(`/datasets/${datasetId}/stats`).catch(() => [])
                ]);

                const columns: string[] = previewRes.columns || [];
                const sample_data: Record<string, unknown>[] = previewRes.data || [];
                const total_rows: number = previewRes.total_rows || sample_data.length;

                const column_details: ColumnMeta[] = statsRes.map((s: any) => ({
                    name: s.name,
                    type: s.type || 'object',
                    missing_count: s.missing_values ?? 0,
                    unique_count: s.unique_values ?? 0,
                }));

                setData({
                    columns,
                    sample_data,
                    metadata: {
                        total_rows,
                        column_details: column_details.length > 0 ? column_details : columns.map(c => ({
                            name: c,
                            type: 'object',
                            missing_count: 0,
                            unique_count: sample_data.length
                        }))
                    }
                });
            } catch (error: any) {
                const msg = error instanceof Error ? error.message : 'Failed to load dataset';
                if (msg.includes('404') || msg.includes('missing') || msg.includes('not found')) {
                    setFileMissing(true);
                } else {
                    addToast(msg, 'error');
                }
            } finally {
                setLoading(false);
            }
        };
        void loadData();
    }, [datasetId, addToast]);

    const handleRepairDataset = async () => {
        setRepairing(true);
        try {
            const newDs = await apiFetch('/datasets/seed', { method: 'POST' });
            addToast('Generated new benchmark sales dataset', 'success');
            router.push(`/explore/${newDs.id}`);
        } catch {
            addToast('Failed to generate benchmark dataset', 'error');
        } finally {
            setRepairing(false);
        }
    };

    const handleDeleteRecord = async () => {
        try {
            await apiFetch(`/datasets/${datasetId}`, { method: 'DELETE' });
            addToast('Cleaned up dataset record', 'success');
            router.push('/');
        } catch {
            router.push('/');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-100 gap-3 saas-card p-8 text-xs text-(--brand-secondary)">
                <svg className="animate-spin w-6 h-6 text-(--brand-primary)" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="font-semibold uppercase tracking-wider">Loading dataset preview & stats...</p>
            </div>
        );
    }

    if (fileMissing || !data) {
        return (
            <div className="saas-card p-6 max-w-xl mx-auto my-8 font-mono text-xs">
                <div className="flex items-center gap-2.5 text-rose-600 mb-3 font-semibold">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <h3 className="text-sm font-semibold uppercase">
                        DATASET SOURCE FILE NOT FOUND (404)
                    </h3>
                </div>
                <p className="text-(--brand-secondary) leading-relaxed mb-5">
                    Dataset #{datasetId} exists in the catalog database, but its underlying file storage was moved or deleted.
                </p>
                <div className="flex flex-wrap gap-2.5">
                    <button
                        onClick={handleRepairDataset}
                        disabled={repairing}
                        className="saas-button saas-button-primary text-xs"
                    >
                        {repairing ? 'Generating...' : '⚡ Generate Benchmark Dataset'}
                    </button>
                    <button
                        onClick={handleDeleteRecord}
                        className="saas-button saas-button-secondary text-xs"
                    >
                        Delete Record
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="saas-button bg-(--surface-hover) text-(--brand-secondary) border border-(--border-color) text-xs"
                    >
                        ← Return to Catalog
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'preview', label: 'DATA PREVIEW' },
        { id: 'schema', label: 'SCHEMA & METADATA' },
        { id: 'quality', label: 'DATA QUALITY ASSESSMENT' },
    ] as const;

    const totalMissing = data.metadata.column_details.reduce((a, b) => a + b.missing_count, 0);
    const totalCells = (data.metadata.total_rows || 1) * (data.columns.length || 1);
    const completenessPct = totalCells > 0 ? (100 - (totalMissing / totalCells * 100)).toFixed(1) : "100.0";

    return (
        <div className="saas-card flex flex-col h-full min-h-125 overflow-hidden">
            
            {/* Header Tabs */}
            <div className="border-b border-(--border-color) px-4 pt-3 flex items-center justify-between bg-(--surface-hover)">
                <div className="flex gap-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-2.5 text-xs font-semibold tracking-wider transition-colors border-b-2 uppercase ${
                                activeTab === tab.id 
                                ? 'border-(--brand-primary) text-(--brand-primary)' 
                                : 'border-transparent text-(--brand-secondary) hover:text-(--foreground)'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="pb-2.5 flex items-center gap-3 text-xs font-mono text-(--brand-secondary)">
                    <span>ROWS: <strong className="text-(--foreground)">{data.metadata.total_rows.toLocaleString()}</strong></span>
                    <span>|</span>
                    <span>COLS: <strong className="text-(--foreground)">{data.columns.length}</strong></span>
                </div>
            </div>

            {/* Content Viewport */}
            <div className="flex-1 p-0 overflow-auto bg-(--surface)">
                
                {activeTab === 'preview' && (
                    <div className="w-full overflow-x-auto">
                        <table className="saas-table whitespace-nowrap">
                            <thead>
                                <tr>
                                    {data.columns.map(col => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.sample_data.map((row, i) => (
                                    <tr key={i}>
                                        {data.columns.map(col => (
                                            <td key={col} className="font-mono text-xs text-(--foreground)">
                                                {String(row[col] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'schema' && (
                    <div className="p-4">
                        <table className="saas-table w-full">
                            <thead>
                                <tr>
                                    <th>COLUMN NAME</th>
                                    <th>DATA TYPE</th>
                                    <th>UNIQUE VALUES</th>
                                    <th>NULL VALUES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.metadata.column_details.map(col => (
                                    <tr key={col.name} className="text-xs">
                                        <td className="font-semibold font-mono text-(--foreground)">{col.name}</td>
                                        <td>
                                            <TechnicalBadge text={col.type} status="blueprint" />
                                        </td>
                                        <td className="font-mono font-semibold">{col.unique_count.toLocaleString()}</td>
                                        <td>
                                            <span className={`font-mono font-semibold ${col.missing_count > 0 ? 'text-(--status-warning)' : 'text-(--status-success)'}`}>
                                                {col.missing_count.toLocaleString()} ({(data.metadata.total_rows > 0 ? (col.missing_count / data.metadata.total_rows * 100) : 0).toFixed(1)}%)
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'quality' && (
                    <div className="p-5 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="saas-card p-4">
                                <span className="text-xs font-semibold text-(--brand-secondary) uppercase block mb-1">Completeness Score</span>
                                <span className="text-2xl font-bold text-(--status-success) font-mono">
                                    {completenessPct}%
                                </span>
                            </div>
                            <div className="saas-card p-4">
                                <span className="text-xs font-semibold text-(--brand-secondary) uppercase block mb-1">Columns w/ Null Values</span>
                                <span className="text-2xl font-bold text-(--status-warning) font-mono">
                                    {data.metadata.column_details.filter(c => c.missing_count > 0).length}
                                </span>
                            </div>
                        </div>

                        <div className="saas-card overflow-hidden">
                            <div className="bg-(--surface-hover) p-3 border-b border-(--border-color)">
                                <h4 className="text-xs font-semibold text-(--foreground) uppercase">DATA INTEGRITY LOG</h4>
                            </div>
                            <div className="p-0">
                                {data.metadata.column_details.filter(c => c.missing_count > 0).length === 0 ? (
                                    <div className="p-4 flex items-center gap-2 text-(--status-success) text-xs font-semibold">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Verification Passed: No null values or data completeness gaps detected.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-(--border-color) text-xs font-mono">
                                        {data.metadata.column_details.filter(c => c.missing_count > 0).map(col => (
                                            <li key={col.name} className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-(--status-warning)">⚠️</span>
                                                    <span className="font-semibold text-(--foreground)">{col.name}</span>
                                                </div>
                                                <span className="text-(--status-warning) font-semibold">
                                                    Missing {col.missing_count.toLocaleString()} values ({(data.metadata.total_rows > 0 ? (col.missing_count / data.metadata.total_rows * 100) : 0).toFixed(1)}%)
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
