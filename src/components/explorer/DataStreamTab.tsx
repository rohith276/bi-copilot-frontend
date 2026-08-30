"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PaperTape, TechnicalBadge } from '../PaperAccents';
import { useToast } from '../Toast';

function formatCell(value: any): React.ReactNode {
    if (value == null || value === '') return <span className="text-amber-500 italic font-bold">NULL</span>;
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return value.toLocaleString();
        return value.toFixed(2);
    }
    return String(value);
}

function exportToCSV(columns: string[], data: any[], filename: string) {
    const header = columns.join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const val = row[col];
            if (val == null) return '';
            const str = String(val);
            // Escape commas and quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

interface DataStreamTabProps {
    columns: string[];
    filteredData: any[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataStreamTab({ columns, filteredData, searchTerm, setSearchTerm }: DataStreamTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>(null);
    const { addToast } = useToast();
    const rowsPerPage = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSort = (col: string) => {
        if (sortCol === col) {
            // Cycle: asc → desc → none
            if (sortDir === 'asc') {
                setSortDir('desc');
            } else if (sortDir === 'desc') {
                setSortCol(null);
                setSortDir(null);
            }
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const sortedData = useMemo(() => {
        if (!sortCol || !sortDir) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortCol];
            const bVal = b[sortCol];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
            }
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortCol, sortDir]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleExport = () => {
        exportToCSV(columns, sortedData, `data_export_${new Date().toISOString().slice(0, 10)}.csv`);
        addToast(`Exported ${sortedData.length} rows as CSV`, 'success');
    };

    const getSortIcon = (col: string) => {
        if (sortCol !== col) return '⇅';
        return sortDir === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="space-y-4 font-mono text-xs">
            {/* Search + Export Bar */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-(--brand-secondary)">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Filter rows by keyword..."
                        className="saas-input pl-9 w-full font-mono text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {sortCol && (
                        <TechnicalBadge text={`SORT: ${sortCol} ${sortDir?.toUpperCase()}`} status="blueprint" />
                    )}
                    <TechnicalBadge text={`${sortedData.length.toLocaleString()} ROWS`} status="blueprint" />
                    <button
                        onClick={handleExport}
                        className="bg-(--brand-primary) text-white font-mono text-[10px] px-3 py-1.5 rounded hover:opacity-90 transition-opacity uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="paper-sheet overflow-x-auto relative">
                <table className="saas-table whitespace-nowrap">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col}
                                    className="bg-(--surface) text-xs font-mono font-bold text-(--brand-secondary) cursor-pointer hover:text-(--foreground) transition-colors select-none group"
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col}
                                        <span className={`text-[10px] transition-opacity ${sortCol === col ? 'opacity-100 text-(--brand-primary)' : 'opacity-30 group-hover:opacity-60'}`}>
                                            {getSortIcon(col)}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                            <tr key={i} className="hover:bg-(--surface-hover)">
                                {columns.map(col => (
                                    <td key={col} className="font-mono text-xs text-(--foreground) max-w-xs truncate">
                                        {formatCell(row[col])}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-(--brand-secondary)">
                                    No records match search filter &quot;{searchTerm}&quot;
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-(--surface) border border-(--border-color) rounded font-mono text-xs">
                    <p className="text-(--brand-secondary)">
                        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length.toLocaleString()} records
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="saas-button saas-button-secondary text-xs uppercase"
                        >
                            ← Prev
                        </button>
                        <span className="px-3 py-1 font-bold text-(--foreground)">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="saas-button saas-button-secondary text-xs uppercase"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
