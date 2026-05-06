"use client";

import React, { useState, useEffect } from 'react';

function formatCell(value: any): React.ReactNode {
    if (value == null || value === '') return <span className="text-pink-400 italic font-black">NULL</span>;
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return value.toLocaleString();
        return value.toFixed(2);
    }
    return String(value);
}

interface DataStreamTabProps {
    columns: string[];
    filteredData: any[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export default function DataStreamTab({ columns, filteredData, searchTerm, setSearchTerm }: DataStreamTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    // Reset pagination when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="space-y-6">
            <div className="relative w-full max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input
                    type="text"
                    placeholder="PROBE VECTOR DATA..."
                    className="w-full pl-12 pr-6 py-2.5 bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all duration-500 shadow-inner dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="rounded-[32px] border border-slate-200/50 dark:border-slate-700 overflow-x-auto shadow-2xl bg-white/80 dark:bg-slate-800/80 custom-scrollbar">
                <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-900 text-white border-b-4 border-indigo-600">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="px-6 py-5 font-black uppercase tracking-widest whitespace-nowrap">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 animate-in fade-in slide-in-from-left-2 overflow-hidden">
                                {columns.map(col => (
                                    <td key={col} className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium max-w-xs truncate border-r border-slate-50 dark:border-white/5 last:border-r-0">
                                        {formatCell(row[col])}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr><td colSpan={columns.length} className="px-6 py-24 text-center">
                                <div className="flex flex-col items-center opacity-30">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Zero Collisions For: "{searchTerm}"</span>
                                </div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/50 dark:border-slate-700 shadow-sm mt-4 gap-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sm:text-left">
                        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length.toLocaleString()} vectors
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm dark:text-white"
                        >
                            Prior Node
                        </button>
                        <span className="px-4 py-2 text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-inner">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm dark:text-white"
                        >
                            Next Node
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
