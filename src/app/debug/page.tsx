"use client";

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';

export default function DebugPage() {
    const [stats, setStats] = useState<any>(null);
    
    useEffect(() => {
        setStats({
            window_location: window.location.href,
            hostname: window.location.hostname,
            env_api_url: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
            final_api_url: getApiBaseUrl(),
            user_agent: navigator.userAgent
        });
    }, []);

    if (!stats) return <div className="p-10 text-white">Loading debug context...</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] p-10 font-mono text-xs">
            <h1 className="text-2xl text-indigo-400 mb-6 font-black uppercase">Intelligence Debug Console</h1>
            
            <div className="space-y-4 max-w-2xl">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-500 mb-2 uppercase tracking-widest text-[10px]">Active Endpoint</p>
                    <p className="text-xl text-emerald-400 break-all">{stats.final_api_url}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 mb-1 uppercase tracking-widest text-[10px]">Build Env Var</p>
                        <p className="text-white">{stats.env_api_url}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 mb-1 uppercase tracking-widest text-[10px]">Origin Host</p>
                        <p className="text-white">{stats.hostname}</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-500 mb-2 uppercase tracking-widest text-[10px]">Manual Migration Tool</p>
                    <div className="flex gap-2">
                        <input 
                            id="manual_url"
                            type="text" 
                            placeholder="https://your-backend.onrender.com"
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button 
                            onClick={() => {
                                const url = (document.getElementById('manual_url') as HTMLInputElement).value;
                                if (url) {
                                    localStorage.setItem('bi_api_url', url);
                                    window.location.reload();
                                }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <p className="text-red-400 font-bold mb-2 text-sm uppercase tracking-tighter">🚨 Immediate Action Required</p>
                    <p className="text-red-300/70 text-[11px] mb-4">
                        Your Vercel build is currently <b>disconnected</b> from the intelligence engine. Follow these steps:
                    </p>
                    <ul className="list-disc list-inside text-red-300/70 space-y-2 text-[11px]">
                        <li><b>Short Term:</b> Paste <code>https://bi-copilot-backend.onrender.com</code> in the box above and click Apply.</li>
                        <li><b>Permanent:</b> Go to Vercel Settings, add <b>NEXT_PUBLIC_API_URL</b>, and Redeploy.</li>
                    </ul>
                </div>

                <button 
                    onClick={() => {
                        localStorage.removeItem('bi_api_url');
                        window.location.reload();
                    }}
                    className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/50 rounded-lg transition-colors uppercase font-bold tracking-tighter text-[10px] border border-white/5"
                >
                    Clear Override & Use System Defaults
                </button>
            </div>
        </div>
    );
}
