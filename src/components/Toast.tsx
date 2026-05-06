"use client";

import React, { useState, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 11);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-right-full duration-300 ${
                            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-emerald-500/20' :
                            toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-100 shadow-red-500/20' :
                            'bg-indigo-500/10 border-indigo-500/30 text-indigo-100 shadow-indigo-500/20'
                        }`}
                    >
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                            toast.type === 'success' ? 'bg-emerald-400' :
                            toast.type === 'error' ? 'bg-red-400' :
                            'bg-indigo-400'
                        }`} />
                        <span className="text-sm font-semibold">{toast.message}</span>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="ml-4 text-white/40 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
