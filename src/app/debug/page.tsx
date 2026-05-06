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

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <p className="text-red-400 font-bold mb-2">Troubleshooting Guide:</p>
                    <ul className="list-disc list-inside text-red-300/70 space-y-2">
                        <li>If "Build Env Var" is <b>NOT SET</b> or <b>http://localhost:8000</b>: You must add <b>NEXT_PUBLIC_API_URL</b> to Vercel Settings and Redeploy.</li>
                        <li>If "Active Endpoint" is still localhost: The frontend cannot find your backend. Ensure the Vercel variable has no trailing slash.</li>
                    </ul>
                </div>

                <button 
                    onClick={() => {
                        localStorage.removeItem('bi_api_url');
                        window.location.reload();
                    }}
                    className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors uppercase font-bold tracking-tighter"
                >
                    Reset Connection Cache
                </button>
            </div>
        </div>
    );
}
