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
        const safeMessage = typeof message === 'string' ? message : (message && typeof (message as any).message === 'string' ? (message as any).message : JSON.stringify(message));
        setToasts((prev) => [...prev, { id, message: safeMessage, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`paper-sheet p-3 flex items-center gap-3 animate-in slide-in-from-right-full duration-300 relative overflow-hidden ${
                            toast.type === 'success' ? 'border-l-2 border-l-emerald-500' :
                            toast.type === 'error' ? 'border-l-2 border-l-red-500' :
                            'border-l-2 border-l-(--brand-primary)'
                        }`}
                    >
                        <div className={`w-2 h-2 shrink-0 ${
                            toast.type === 'success' ? 'bg-emerald-500' :
                            toast.type === 'error' ? 'bg-red-500' :
                            'bg-(--brand-primary)'
                        }`} />
                        <span className="text-xs font-mono font-bold text-(--foreground) tracking-wide">{toast.message}</span>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="ml-2 text-(--brand-secondary) hover:text-(--foreground) transition-colors p-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
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
