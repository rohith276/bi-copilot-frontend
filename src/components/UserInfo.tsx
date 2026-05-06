"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function UserInfo() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all group">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white uppercase tracking-tight">{user.username || user.email.split('@')[0]}</span>
                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Active Operative</span>
            </div>
            <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                {(user.username || user.email)[0].toUpperCase()}
            </div>
            <button 
                onClick={logout}
                className="ml-2 p-2 hover:bg-pink-500/20 rounded-lg text-pink-400 opacity-0 group-hover:opacity-100 transition-all transition-duration-300"
                title="Terminate Session"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
        </div>
    );
}
