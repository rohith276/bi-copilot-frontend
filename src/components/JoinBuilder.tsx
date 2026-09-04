"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { TechnicalBadge } from '@/components/PaperAccents';

interface DatasetOption {
    id: number;
    filename: string;
    column_count: number;
    row_count: number;
}

interface JoinBuilderProps {
    currentDatasetId: number;
    onJoinComplete?: (newDatasetId: number) => void;
}

export default function JoinBuilder({ currentDatasetId, onJoinComplete }: JoinBuilderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [datasets, setDatasets] = useState<DatasetOption[]>([]);
    const [rightId, setRightId] = useState<number | null>(null);
    const [leftCols, setLeftCols] = useState<string[]>([]);
    const [rightCols, setRightCols] = useState<string[]>([]);
    const [leftCol, setLeftCol] = useState('');
    const [rightCol, setRightCol] = useState('');
    const [joinType, setJoinType] = useState('inner');
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Load available datasets
    useEffect(() => {
        if (!isOpen) return;
        const fetchDatasets = async () => {
            try {
                const data = await apiFetch('/datasets/');
                setDatasets(data.filter((d: DatasetOption) => d.id !== currentDatasetId));
            } catch {
                addToast('Failed to load datasets', 'error');
            }
        };
        fetchDatasets();
    }, [isOpen, currentDatasetId]);

    // Load columns for left dataset
    useEffect(() => {
        if (!isOpen) return;
        const fetchCols = async () => {
            try {
                const stats = await apiFetch(`/datasets/${currentDatasetId}/stats`);
                setLeftCols(stats.map((s: any) => s.name));
            } catch { /* ignore */ }
        };
        fetchCols();
    }, [isOpen, currentDatasetId]);

    // Load columns for right dataset
    useEffect(() => {
        if (!rightId) return;
        const fetchCols = async () => {
            try {
                const stats = await apiFetch(`/datasets/${rightId}/stats`);
                setRightCols(stats.map((s: any) => s.name));
            } catch { /* ignore */ }
        };
        fetchCols();
    }, [rightId]);

    const handleAutoDetect = async () => {
        if (!rightId) {
            addToast('Please select a dataset to join with first.', 'error');
            return;
        }
        
        try {
            setLoading(true);
            const data = await apiFetch(`/analytics/suggest-joins`, {
                method: 'POST',
                body: JSON.stringify({
                    left_dataset_id: currentDatasetId,
                    right_dataset_id: rightId
                })
            });
            
            if (data && data.suggestions && data.suggestions.length > 0) {
                const best = data.suggestions[0];
                setLeftCol(best.left_col);
                setRightCol(best.right_col);
                addToast(`Auto-detected join: ${best.left_col} ↔ ${best.right_col} (${(best.confidence * 100).toFixed(0)}% confidence)`, 'success');
            } else {
                addToast('No obvious relationships found.', 'error');
            }
        } catch (e) {
            addToast(`Auto-detect failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!rightId || !leftCol || !rightCol) {
            addToast('Select both datasets and join columns', 'error');
            return;
        }
        setLoading(true);
        try {
            const data = await apiFetch('/datasets/join/preview', {
                method: 'POST',
                body: JSON.stringify({
                    left_id: currentDatasetId,
                    right_id: rightId,
                    left_col: leftCol,
                    right_col: rightCol,
                    join_type: joinType,
                }),
            });
            setPreview(data);
        } catch (e) {
            addToast(`Preview failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!rightId || !leftCol || !rightCol) return;
        setSaving(true);
        try {
            const result = await apiFetch('/datasets/join/save', {
                method: 'POST',
                body: JSON.stringify({
                    left_id: currentDatasetId,
                    right_id: rightId,
                    left_col: leftCol,
                    right_col: rightCol,
                    join_type: joinType,
                }),
            });
            addToast(`Created joined dataset: ${result.filename} (${result.row_count} rows)`, 'success');
            setIsOpen(false);
            onJoinComplete?.(result.dataset_id);
        } catch (e) {
            addToast(`Save failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const triggerButton = (
        <button
            onClick={() => setIsOpen(true)}
            className="saas-button saas-button-secondary font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5"
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Join Datasets
        </button>
    );

    const joinTypes = [
        { value: 'inner', label: 'INNER', desc: 'Only matching rows' },
        { value: 'left', label: 'LEFT', desc: 'All left + matching right' },
        { value: 'right', label: 'RIGHT', desc: 'All right + matching left' },
        { value: 'full', label: 'FULL', desc: 'All rows from both' },
    ];

    return (
        <>
            {triggerButton}
            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <div className="paper-sheet p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-mono font-bold text-sm text-(--foreground) uppercase tracking-widest">Cross-Dataset Join Builder</h2>
                    <button onClick={() => setIsOpen(false)} className="text-(--brand-secondary) hover:text-(--foreground) text-lg">×</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Left dataset */}
                    <div className="space-y-2">
                        <label className="font-mono text-[10px] text-(--brand-secondary) uppercase tracking-wider font-bold block">
                            Left Dataset (Current)
                        </label>
                        <div className="bg-(--surface) border border-(--brand-primary)/30 rounded p-2 font-mono text-xs text-(--foreground) font-bold">
                            Dataset #{currentDatasetId}
                        </div>
                        <select
                            value={leftCol}
                            onChange={e => setLeftCol(e.target.value)}
                            className="saas-input font-mono text-xs w-full"
                        >
                            <option value="">Select join column...</option>
                            {leftCols.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>

                    {/* Right dataset */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] font-mono text-(--brand-secondary) uppercase tracking-wider font-bold">
                                Right Dataset
                            </label>
                            <button
                                onClick={handleAutoDetect}
                                disabled={!rightId || loading}
                                className="text-[9px] font-mono font-bold uppercase text-(--brand-primary) bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors"
                            >
                                ✨ Auto-Detect
                            </button>
                        </div>
                        <select
                            value={rightId || ''}
                            onChange={e => { setRightId(Number(e.target.value)); setRightCol(''); }}
                            className="saas-input font-mono text-xs w-full"
                        >
                            <option value="">Select dataset...</option>
                            {datasets.map(ds => (
                                <option key={ds.id} value={ds.id}>{ds.filename} ({ds.row_count} rows)</option>
                            ))}
                        </select>
                        <select
                            value={rightCol}
                            onChange={e => setRightCol(e.target.value)}
                            className="saas-input font-mono text-xs w-full"
                            disabled={!rightId}
                        >
                            <option value="">Select join column...</option>
                            {rightCols.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                </div>

                {/* Join Type */}
                <div className="mb-4">
                    <label className="font-mono text-[10px] text-(--brand-secondary) uppercase tracking-wider font-bold block mb-2">
                        Join Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {joinTypes.map(jt => (
                            <button
                                key={jt.value}
                                onClick={() => setJoinType(jt.value)}
                                className={`p-2 rounded border font-mono text-[10px] text-center transition-colors ${
                                    joinType === jt.value
                                        ? 'bg-(--brand-primary) text-white border-(--brand-primary)'
                                        : 'bg-(--surface) text-(--foreground) border-(--border-color) hover:border-(--brand-primary)'
                                }`}
                            >
                                <div className="font-bold">{jt.label}</div>
                                <div className="text-[8px] opacity-70 mt-0.5">{jt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handlePreview}
                        disabled={!rightId || !leftCol || !rightCol || loading}
                        className="saas-button saas-button-secondary font-mono text-xs uppercase tracking-wider flex-1"
                    >
                        {loading ? 'Previewing...' : '👁 Preview Join (20 rows)'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!rightId || !leftCol || !rightCol || saving}
                        className="saas-button saas-button-primary font-mono text-xs uppercase tracking-wider flex-1"
                    >
                        {saving ? 'Saving...' : '💾 Save as New Dataset'}
                    </button>
                </div>

                {/* Preview Table */}
                {preview && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <TechnicalBadge text={`${preview.row_count} PREVIEW ROWS`} status="blueprint" />
                            <TechnicalBadge text={`${preview.columns.length} COLUMNS`} status="success" />
                        </div>
                        <div className="overflow-x-auto max-h-64 border border-(--border-color) rounded">
                            <table className="saas-table whitespace-nowrap text-[10px]">
                                <thead>
                                    <tr>
                                        {preview.columns.map((col: string) => (
                                            <th key={col} className="bg-(--surface) font-mono font-bold text-(--brand-secondary)">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.data.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-(--surface-hover)">
                                            {preview.columns.map((col: string) => (
                                                <td key={col} className="font-mono text-(--foreground) max-w-32 truncate">
                                                    {row[col] == null ? <span className="text-amber-500 italic">NULL</span> : String(row[col])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
        )}
        </>
    );
}
