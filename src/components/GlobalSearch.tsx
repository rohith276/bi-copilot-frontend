"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface SearchResult {
    id: number;
    title: string;
    type: string;
    dataset_id: number;
    description: string;
}

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                document.getElementById('global-search-input')?.focus();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query || query.length < 2) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const data = await apiFetch(`/search/?q=${encodeURIComponent(query)}`);
                setResults(data);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        setQuery('');
        if (result.type === 'dataset') {
            router.push(`/explore/${result.dataset_id}`);
        } else if (result.type === 'dashboard') {
            router.push(`/dashboard/${result.dataset_id}`);
        }
    };

    return (
        <div ref={wrapperRef} className="relative z-50">
            <div 
                className="flex items-center gap-2 bg-(--surface) border border-(--border-color) rounded px-3 py-1.5 cursor-text focus-within:border-(--brand-primary) transition-colors w-64"
                onClick={() => setIsOpen(true)}
            >
                <svg className="w-4 h-4 text-(--brand-secondary)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    id="global-search-input"
                    type="text"
                    placeholder="Search datasets, dashboards... (Ctrl+K)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="bg-transparent border-none outline-none text-xs font-mono text-(--foreground) w-full placeholder-(--brand-secondary)"
                />
            </div>

            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 mt-1 w-96 bg-(--surface) border border-(--border-color) rounded shadow-lg overflow-hidden flex flex-col max-h-96">
                    {isLoading && (
                        <div className="p-3 text-center text-xs font-mono text-(--brand-secondary)">Searching...</div>
                    )}
                    
                    {!isLoading && results.length === 0 && (
                        <div className="p-3 text-center text-xs font-mono text-(--brand-secondary)">No results found.</div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="overflow-y-auto">
                            {results.map((r, i) => (
                                <div 
                                    key={`${r.type}-${r.id}-${i}`}
                                    onClick={() => handleSelect(r)}
                                    className="p-3 border-b border-(--border-color) last:border-b-0 hover:bg-(--surface-hover) cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-xs font-bold text-(--brand-primary)">{r.title}</span>
                                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${r.type === 'dataset' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {r.type}
                                        </span>
                                    </div>
                                    <p className="font-mono text-[10px] text-(--brand-secondary)">{r.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
