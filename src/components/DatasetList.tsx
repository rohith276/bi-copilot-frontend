"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface Dataset {
    id: number;
    filename: string;
    file_type: string;
    row_count: number;
    column_count: number;
    created_at: string;
}

export default function DatasetList() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [seeding, setSeeding] = useState(false);
    const { addToast } = useToast();

    const handleSeedData = async () => {
        setSeeding(true);
        try {
            await apiFetch('/datasets/seed', { method: 'POST' });
            addToast('Sample dataset seeded successfully!', 'success');
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
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Database sync failed', 'error');
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
            addToast('Dataset permanently removed', 'success');
            window.dispatchEvent(new Event('bi:datasets-changed'));
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to delete dataset', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="bg-white/4 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-700 hover:shadow-indigo-500/10">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-transparent">
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Dataset Library</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Ready for deep processing</p>
                    </div>
                    <button
                        onClick={() => {
                            setLoading(true);
                            fetchDatasets();
                            addToast('Refreshing library...', 'info');
                        }}
                        className="p-3 bg-white dark:bg-slate-800 border border-white/10 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-500 text-slate-400 shadow-xl active:rotate-180 group"
                    >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>
                </div>

                <div className="overflow-x-auto px-2 pb-2">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest px-6">
                                <th className="px-6 py-4">Filename</th>
                                <th className="px-6 py-4">Format</th>
                                <th className="px-6 py-4">Dimensions</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right pr-12">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-4">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Datasets...</span>
                                    </div>
                                </td></tr>
                            ) : datasets.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-32 text-center animate-in fade-in duration-1000">
                                    <div className="flex flex-col items-center gap-4 opacity-50 capitalize">
                                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                        </div>
                                        <span className="text-sm font-black text-slate-500 italic tracking-widest">Library Empty: Upload a file or seed sample data</span>
                                        <button
                                            onClick={handleSeedData}
                                            disabled={seeding}
                                            className="mt-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {seeding ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Seeding...</>
                                            ) : (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> Seed Sample Data</>
                                            )}
                                        </button>
                                    </div>
                                </td></tr>
                            ) : (
                                datasets.map((dataset) => (
                                    <tr key={dataset.id} className="group bg-surface-100/50 backdrop-blur-sm hover:bg-surface-100 hover:scale-[1.01] hover:shadow-xl transition-all duration-500 rounded-2xl">
                                        <td className="px-6 py-5 first:rounded-l-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 ${dataset.file_type.includes('csv') ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                    }`}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground text-sm">{dataset.filename}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Source Ref: #{dataset.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm transition-all duration-500 ${dataset.file_type.includes('csv')
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
                                                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'
                                                }`}>
                                                {dataset.file_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">{dataset.row_count?.toLocaleString()}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Rows</span>
                                                </div>
                                                <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-700"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">{dataset.column_count}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Cols</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-slate-500 text-[11px] font-black">
                                            {new Date(dataset.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5 text-right last:rounded-r-2xl pr-8">
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                                                <Link
                                                    href={`/dashboard/${dataset.id}`}
                                                    className="px-4 py-2 bg-indigo-600/10 text-indigo-600 border border-indigo-600/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    href={`/explore/${dataset.id}`}
                                                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-center"
                                                >
                                                    Explore
                                                </Link>
                                                <button
                                                    onClick={() => setDeletingId(dataset.id)}
                                                    className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:shadow-lg rounded-xl transition-all duration-300"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white rounded-[32px] p-10 max-w-sm w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500 border border-white/20">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Remove Dataset</h3>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">Are you sure you want to delete this dataset? This will remove all associated analytics and insights.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-2xl shadow-red-200 active:scale-95 transition-all"
                            >
                                Secure Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
