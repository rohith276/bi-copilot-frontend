"use client";

import React from 'react';

// Masking Tape Strip for Pinned Paper Sheets
export function PaperTape({ className = "" }: { className?: string }) {
    return (
        <div 
            className={`paper-tape ${className}`} 
            title="Pinned Note"
        />
    );
}

// Notebook Hole Punches
export function NotebookHoles({ className = "" }: { className?: string }) {
    return (
        <div className={`flex flex-col gap-6 ${className}`}>
            {[1, 2, 3, 4, 5].map((h) => (
                <div key={h} className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-slate-700 shadow-inner border border-stone-400/40" />
            ))}
        </div>
    );
}

// Technical Isometric SVG Cube
export function IsometricCube({ className = "" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );
}

// Technical Isometric Database Stack
export function IsometricDatabase({ className = "" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
    );
}

// Engineering Blueprint Badge
export function TechnicalBadge({ text, status = "neutral" }: { text: string; status?: "neutral" | "blueprint" | "success" | "warning" | "danger" }) {
    const statusMap = {
        neutral: "saas-badge-neutral",
        blueprint: "saas-badge-primary font-mono",
        success: "saas-badge-success",
        warning: "saas-badge-warning",
        danger: "saas-badge-warning text-red-600 border-red-200",
    };

    return (
        <span className={`saas-badge ${statusMap[status] || statusMap.neutral}`}>
            {text}
        </span>
    );
}

// System Status Telemetry Dot
export function StatusDot({ status = "online" }: { status?: "online" | "offline" | "warning" | "checking" }) {
    const bgMap = {
        online: "bg-emerald-500",
        offline: "bg-rose-500",
        warning: "bg-amber-500",
        checking: "bg-stone-400 animate-pulse",
    };

    return <span className={`w-2 h-2 rounded-full inline-block ${bgMap[status]}`} />;
}
