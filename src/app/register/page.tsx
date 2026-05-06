"use client";

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Registration failed';
}

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, username, password }),
            });
            
            addToast('Identity registered successfully', 'success');
            router.push('/login');
        } catch (error) {
            addToast(getErrorMessage(error), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:1s]"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Register Identity</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">New Operative Onboarding</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Operative Name</label>
                            <input
                                type="text"
                                required
                                autoComplete="name"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 font-medium"
                                placeholder="Agent 001"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Vector ID (Email)</label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 font-medium"
                                placeholder="operative@hq.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Secure Key (Password)</label>
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 mt-4"
                        >
                            {loading ? 'Initializing...' : 'Register Operative'}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            Existing Operative? <Link href="/login" className="text-emerald-400 hover:text-white transition-colors underline decoration-emerald-400/30 underline-offset-4 ml-1">Initialize Connection</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
