"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getApiBaseUrl, apiFetch } from '@/lib/api';
import { useTheme } from './ThemeContext';
import { StatusDot } from './PaperAccents';
import GraphPaperBackground from './GraphPaperBackground';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [engineStatus, setEngineStatus] = useState<"checking" | "online" | "offline">("checking");
    const [isCmdPaletteOpen, setCmdPaletteOpen] = useState(false);
    const [cmdQuery, setCmdQuery] = useState('');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${getApiBaseUrl().replace(/\/$/, '')}/`);
                setEngineStatus(response.ok ? 'online' : 'offline');
            } catch {
                setEngineStatus("offline");
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 30000);

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCmdPaletteOpen(true);
            }
            if (e.key === 'Escape') setCmdPaletteOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(interval);
        };
    }, []);
    const isDashboard = pathname.startsWith('/dashboard');

    return (
        <GraphPaperBackground>
            <div className="flex h-screen overflow-hidden w-full bg-transparent">
                {/* Left Navigation (The Drafting Tools) */}
                <aside className="w-16 hover:w-56 group shrink-0 bg-(--surface) text-(--foreground) border-r border-(--border-color) flex flex-col z-40 shadow-xs transition-all duration-300 ease-in-out absolute md:relative h-full overflow-hidden">
                    {/* Branding */}
                    <div className="h-14 px-4 border-b border-(--border-color) flex items-center shrink-0">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                            <img src="/logo.png" alt="BI Copilot Logo" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen" />
                        </div>
                        <div className="ml-3 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
                            <h1 className="font-semibold text-xs text-(--foreground) tracking-tight">
                                BI Copilot <span className="text-[10px] text-(--brand-primary) font-mono">v2.4</span>
                            </h1>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 py-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                        <Link href="/" className={`flex items-center px-5 py-2.5 mx-2 rounded transition-colors ${pathname === '/' ? 'bg-(--brand-primary) text-white shadow-xs' : 'text-(--foreground) hover:bg-(--surface-hover)'}`}>
                            <svg className={`w-5 h-5 shrink-0 ${pathname === '/' ? 'text-white' : 'text-(--brand-primary)'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                            <span className="ml-3 text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Dataset Catalog</span>
                        </Link>
                        
                        <Link href="/?tab=history" className="flex items-center px-5 py-2.5 mx-2 rounded text-(--foreground) hover:bg-(--surface-hover) transition-colors">
                            <svg className="w-5 h-5 shrink-0 text-(--brand-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="ml-3 text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Execution Logs</span>
                        </Link>
                        
                        <Link href="/?tab=settings" className="flex items-center px-5 py-2.5 mx-2 rounded text-(--foreground) hover:bg-(--surface-hover) transition-colors">
                            <svg className="w-5 h-5 shrink-0 text-(--brand-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.11 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="ml-3 text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">System Config</span>
                        </Link>
                    </nav>

                    {/* Theme Toggle & Engine Status */}
                    <div className="p-3 border-t border-(--border-color) bg-(--surface-hover) shrink-0 flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <StatusDot status={engineStatus === 'online' ? 'online' : 'offline'} />
                            <span className="text-[10px] text-(--brand-secondary) font-mono uppercase tracking-wider">
                                Engine: {engineStatus}
                            </span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-center md:justify-between px-2 py-2 text-(--brand-secondary) hover:text-(--foreground) hover:bg-(--surface) rounded transition-colors"
                            title="Toggle Theme"
                        >
                            <span className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">SWITCH MODE</span>
                            <svg className="w-5 h-5 text-(--brand-primary) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={theme === 'light' ? "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" : "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"}></path></svg>
                        </button>
                    </div>
                </aside>

                {/* Main Content Column */}
                <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden z-10">
                    {/* Top Ruler / Header */}
                    <header className="h-14 bg-(--surface)/80 backdrop-blur-md border-b border-(--border-color) flex items-center justify-between px-6 shrink-0 z-30 shadow-sm relative">
                        <div className="flex items-center gap-2.5 text-xs font-semibold text-(--foreground)">
                            <span className="font-mono uppercase text-(--brand-secondary) tracking-wider">WORKSPACE</span>
                            <span className="text-(--border-color)">/</span>
                            <span className="font-bold capitalize">{pathname === '/' ? 'CATALOG' : pathname.split('/')[1]}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setCmdPaletteOpen(true)}
                                className="flex items-center gap-3 px-3 py-1.5 bg-(--surface-hover) border border-(--border-color) rounded text-xs text-(--brand-secondary) hover:text-(--foreground) hover:border-blue-400/50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                            >
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-(--brand-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    Ask AI...
                                </span>
                                <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 bg-(--surface) border border-(--border-color) rounded text-(--brand-secondary) font-bold">
                                    ⌘K
                                </kbd>
                            </button>
                            <div className="hidden md:flex items-center gap-4 border-l border-(--border-color) pl-4 ml-4">
                                <div className="flex items-center gap-2">
                                    <StatusDot status={engineStatus} />
                                    <span className="text-[10px] font-mono font-bold text-(--brand-secondary) uppercase tracking-widest hidden sm:inline-block">
                                        {engineStatus === 'online' ? 'System Nominal' : 'Engine Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Viewport */}
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        {children}
                    </div>
                </main>

                {/* Global Ask AI Command Palette Modal */}
                {isCmdPaletteOpen && (
                    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm p-4 font-mono">
                        <div className="paper-sheet w-full max-w-2xl overflow-hidden shadow-2xl border border-(--brand-primary)/50 relative">
                            {/* Tape accent */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-100/80 dark:bg-yellow-900/30 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-700/50 shadow-sm rotate-1 z-10 flex items-center justify-center">
                                <span className="text-2 font-bold text-yellow-800/50 dark:text-yellow-200/50 uppercase tracking-widest">AI INPUT</span>
                            </div>
                            
                            <div className="p-4 border-b border-(--border-color) flex items-center gap-3 bg-(--surface)">
                                <svg className="w-5 h-5 text-(--brand-primary) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                <input 
                                    autoFocus
                                    type="text"
                                    value={cmdQuery}
                                    onChange={(e) => setCmdQuery(e.target.value)}
                                    placeholder="Ask a question about your datasets (e.g. 'Show revenue by region')..."
                                    className="w-full bg-transparent border-none outline-none text-sm text-(--foreground) placeholder-(--brand-secondary)"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && cmdQuery.trim()) {
                                            setCmdPaletteOpen(false);
                                            try {
                                                const datasets = await apiFetch('/datasets/');
                                                const match = pathname.match(/\/(?:explore|dashboard)\/(\d+)/);
                                                const dsId = match ? match[1] : datasets[0]?.id;
                                                if (dsId) {
                                                    router.push(`/explore/${dsId}?q=${encodeURIComponent(cmdQuery.trim())}`);
                                                }
                                            } catch {
                                                router.push('/');
                                            }
                                            setCmdQuery('');
                                        }
                                    }}
                                />
                                <kbd className="font-mono text-[10px] px-2 py-1 bg-(--surface-hover) border border-(--border-color) rounded text-(--brand-secondary)">ESC</kbd>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GraphPaperBackground>
    );
}
