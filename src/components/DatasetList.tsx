"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { TechnicalBadge } from './PaperAccents';

interface Dataset {
    id: number;
    filename: string;
    file_type: string;
    row_count: number;
    column_count: number;
    created_at: string;
}

interface DatasetListProps {
    searchQuery?: string;
    onDatasetsCountChange?: (count: number) => void;
}

export default function DatasetList({ searchQuery = '', onDatasetsCountChange }: DatasetListProps) {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [formatFilter, setFormatFilter] = useState<'ALL' | 'CSV' | 'EXCEL'>('ALL');
    const { addToast } = useToast();

    const handleSeedData = async () => {
        setSeeding(true);
        try {
            await apiFetch('/datasets/seed', { method: 'POST' });
            addToast('Sample dataset generated successfully', 'success');
            window.dispatchEvent(new Event('bi:datasets-changed'));
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to seed sample data', 'error');
        } finally {
            setSeeding(false);
        }
    };

    async function fetchDatasets() {
        try {
            const data = await apiFetch('/datasets/');
            setDatasets(data);
            if (onDatasetsCountChange) {
                onDatasetsCountChange(data.length);
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to fetch datasets', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void fetchDatasets();

        const handleDatasetChange = () => {
            setLoading(true);
            void fetchDatasets();
        };

        window.addEventListener('bi:datasets-changed', handleDatasetChange);
        return () => window.removeEventListener('bi:datasets-changed', handleDatasetChange);
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await apiFetch(`/datasets/${id}`, { method: 'DELETE' });
            setDatasets(prev => prev.filter(d => d.id !== id));
            addToast('Dataset deleted successfully', 'success');
            window.dispatchEvent(new Event('bi:datasets-changed'));
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to delete dataset', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredDatasets = datasets.filter(d => {
        const matchesSearch = d.filename.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toString().includes(searchQuery);
        const matchesFormat = formatFilter === 'ALL' 
            ? true 
            : formatFilter === 'CSV' 
            ? d.file_type.toLowerCase().includes('csv')
            : (d.file_type.toLowerCase().includes('xls') || d.file_type.toLowerCase().includes('excel'));
        return matchesSearch && matchesFormat;
    });

    const csvCount = datasets.filter(d => d.file_type.toLowerCase().includes('csv')).length;
    const excelCount = datasets.filter(d => d.file_type.toLowerCase().includes('xls') || d.file_type.toLowerCase().includes('excel')).length;

    return (
        <div className="relative">
            {/* Format Filter Bar */}
            <div className="px-4 py-2 bg-(--surface-hover) border-b border-(--border-color) flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-(--brand-secondary) font-bold uppercase">FILTER:</span>
                    <button
                      onClick={() => setFormatFilter('ALL')}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                        formatFilter === 'ALL' ? 'bg-(--brand-primary) text-white' : 'text-(--brand-secondary) hover:text-(--foreground)'
                      }`}
                    >
                      ALL ({datasets.length})
                    </button>
                    <button
                      onClick={() => setFormatFilter('CSV')}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                        formatFilter === 'CSV' ? 'bg-(--brand-primary) text-white' : 'text-(--brand-secondary) hover:text-(--foreground)'
                      }`}
                    >
                      CSV ({csvCount})
                    </button>
                    <button
                      onClick={() => setFormatFilter('EXCEL')}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                        formatFilter === 'EXCEL' ? 'bg-(--brand-primary) text-white' : 'text-(--brand-secondary) hover:text-(--foreground)'
                      }`}
                    >
                      EXCEL ({excelCount})
                    </button>
                </div>

                <div className="text-[11px] text-(--brand-secondary) font-mono">
                    SHOWING <strong className="text-(--foreground)">{filteredDatasets.length}</strong> / {datasets.length} SPECS
                </div>
            </div>

            {/* Paper Ledger Table */}
            <div className="w-full overflow-x-auto">
                <table className="paper-table">
                    <thead>
                        <tr>
                            <th>[REF ID] DATASET SPECIFICATION</th>
                            <th>FORMAT</th>
                            <th>ROW COUNT</th>
                            <th>COLUMNS</th>
                            <th className="text-right">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8">
                                    <div className="inline-flex items-center gap-2 text-(--brand-secondary) font-mono text-xs">
                                        <svg className="animate-spin w-4 h-4 text-(--brand-primary)" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>QUERYING CATALOG LEDGER...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : datasets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10 font-mono">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-8 h-8 text-(--brand-secondary) mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                        <p className="text-xs font-bold text-(--foreground) mb-1 uppercase tracking-wider">NO DATASETS IN LEDGER</p>
                                        <p className="text-xs text-(--brand-secondary) mb-3">Upload a CSV/Excel file above or generate sample benchmark data.</p>
                                        <button
                                            onClick={handleSeedData}
                                            disabled={seeding}
                                            className="paper-button paper-button-primary text-xs font-mono uppercase"
                                        >
                                            {seeding ? 'GENERATING...' : '⚡ Seed Sample Sales Data'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredDatasets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-xs font-mono text-(--brand-secondary)">
                                    No datasets match current filters.
                                </td>
                            </tr>
                        ) : (
                            filteredDatasets.map((dataset) => (
                                <tr key={dataset.id} className="text-xs font-mono">
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-(--brand-secondary) font-bold">#{dataset.id}</span>
                                            <span className="font-bold text-(--foreground)">{dataset.filename}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <TechnicalBadge 
                                          text={dataset.file_type.toUpperCase()} 
                                          status={dataset.file_type.includes('csv') ? 'blueprint' : 'success'} 
                                        />
                                    </td>
                                    <td className="font-bold text-(--foreground)">{dataset.row_count.toLocaleString()}</td>
                                    <td className="text-(--brand-secondary)">{dataset.column_count} cols</td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/explore/${dataset.id}`}
                                                className="paper-button paper-button-secondary text-xs py-1 px-2.5 font-bold uppercase"
                                                title="Explore Data Specs & AI Analytics"
                                            >
                                                Inspect Specs →
                                            </Link>
                                            <Link
                                                href={`/dashboard/${dataset.id}`}
                                                className="paper-button bg-blue-50 dark:bg-blue-950/40 text-(--brand-primary) border border-blue-200 dark:border-blue-800/40 text-xs py-1 px-2.5 font-bold uppercase"
                                                title="View Executive Dashboard"
                                            >
                                                Dashboard 📊
                                            </Link>
                                            <button
                                                onClick={() => setDeletingId(dataset.id)}
                                                className="p-1.5 text-(--brand-secondary) hover:text-rose-600 hover:bg-(--surface-hover) rounded transition-colors"
                                                title="Delete Dataset"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Technical Deletion Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-mono">
                    <div className="paper-sheet p-5 max-w-sm w-full">
                        <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            Confirm Deletion Spec
                        </h3>
                        <p className="text-xs text-(--brand-secondary) mb-5">
                            Are you sure you want to delete dataset #{deletingId}? This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="paper-button paper-button-secondary text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                className="paper-button bg-rose-600 hover:bg-rose-700 text-white text-xs border-transparent uppercase"
                            >
                                Delete Spec
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
