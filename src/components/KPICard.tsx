"use client";

import React from 'react';

interface KPICardProps {
    value: number | string;
    label: string;
    format?: 'number' | 'currency' | 'percent';
    trend?: { direction: 'up' | 'down' | 'flat'; value: string };
    accentColor?: string;
    compact?: boolean;
}

function formatKPIValue(val: number | string, format: string): string {
    if (typeof val === 'string') return val;
    if (val == null || isNaN(val)) return '—';

    const abs = Math.abs(val);
    let formatted: string;

    if (abs >= 1_000_000_000) {
        formatted = (val / 1_000_000_000).toFixed(1) + 'B';
    } else if (abs >= 1_000_000) {
        formatted = (val / 1_000_000).toFixed(1) + 'M';
    } else if (abs >= 1_000) {
        formatted = (val / 1_000).toFixed(1) + 'K';
    } else if (Number.isInteger(val)) {
        formatted = val.toLocaleString();
    } else {
        formatted = val.toFixed(2);
    }

    if (format === 'currency') return '$' + formatted;
    if (format === 'percent') return formatted + '%';
    return formatted;
}

export default function KPICard({ value, label, format = 'number', trend, accentColor, compact = false }: KPICardProps) {
    const accent = accentColor || 'var(--brand-primary)';

    return (
        <div
            className={`paper-sheet relative overflow-hidden transition-all hover:shadow-md ${compact ? 'p-3' : 'p-4'}`}
            style={{ borderLeft: `3px solid ${accent}` }}
        >
            {/* Accent gradient overlay */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{ background: `linear-gradient(135deg, ${accent} 0%, transparent 60%)` }}
            />

            <div className="relative z-10">
                {/* Callout value */}
                <div
                    className={`font-mono font-black tracking-tight text-(--foreground) ${compact ? 'text-xl' : 'text-3xl'}`}
                >
                    {formatKPIValue(value, format)}
                </div>

                {/* Label */}
                <div className={`font-mono uppercase tracking-widest text-(--brand-secondary) ${compact ? 'text-[8px] mt-0.5' : 'text-[10px] mt-1'}`}>
                    {label}
                </div>

                {/* Trend indicator */}
                {trend && (
                    <div className={`flex items-center gap-1 ${compact ? 'mt-1' : 'mt-2'}`}>
                        <span className={`text-[10px] font-mono font-bold ${
                            trend.direction === 'up' ? 'text-emerald-500' :
                            trend.direction === 'down' ? 'text-rose-500' :
                            'text-(--brand-secondary)'
                        }`}>
                            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'}
                            {' '}{trend.value}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Multi-KPI Row (for dashboard headers) ──────────────────── */
interface KPIRowProps {
    metrics: {
        value: number | string;
        label: string;
        format?: 'number' | 'currency' | 'percent';
        accentColor?: string;
    }[];
}

export function KPIRow({ metrics }: KPIRowProps) {
    const accents = [
        'rgb(37, 99, 235)',    // blue
        'rgb(16, 185, 129)',   // emerald
        'rgb(245, 158, 11)',   // amber
        'rgb(139, 92, 246)',   // violet
        'rgb(239, 68, 68)',    // rose
        'rgb(14, 165, 233)',   // sky
    ];

    return (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)` }}>
            {metrics.map((m, i) => (
                <KPICard
                    key={m.label}
                    value={m.value}
                    label={m.label}
                    format={m.format}
                    accentColor={m.accentColor || accents[i % accents.length]}
                    compact
                />
            ))}
        </div>
    );
}
