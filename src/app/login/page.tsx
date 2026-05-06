"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Authentication failed';
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            
            login(data.access_token, { email });
            addToast('Secure session established', 'success');
            router.push('/');
        } catch (error) {
            addToast(getErrorMessage(error), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 4a2 2 0 114 0v1a2 2 0 012 2v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012-2v1a2 2 0 012 2z"></path></svg>
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Initialize Session</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Data Intelligence Authority</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Vector Identity (Email)</label>
                            <input
                                type="email"
                                required
                                autoComplete="username"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 font-medium"
                                placeholder="name@corporation.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Access Key (Password)</label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 mt-4"
                        >
                            {loading ? 'Authenticating...' : 'Establish Connection'}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            New Operative? <Link href="/register" className="text-indigo-400 hover:text-white transition-colors underline decoration-indigo-400/30 underline-offset-4 ml-1">Register Identity</Link>
                        </p>
                    </div>
                </div>
                
                <div className="mt-8 text-center opacity-30">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">BI-COPILOT // SECURE_CORE_V1</p>
                </div>
            </div>
        </div>
    );
}
