"use client";

import React, { useState, useMemo } from 'react';
import { TechnicalBadge } from './PaperAccents';

interface WhatIfPanelProps {
    baseValue: number;
    label: string;
    forecastValues?: number[];
    forecastDates?: string[];
    onScenarioChange?: (multiplier: number) => void;
}

/**
 * What-If simulation panel — allows users to adjust parameters with sliders
 * and see the impact on forecasted/projected values in real-time.
 */
export default function WhatIfPanel({ baseValue, label, forecastValues, forecastDates, onScenarioChange }: WhatIfPanelProps) {
    const [adjustPct, setAdjustPct] = useState(0);  // -50% to +50%
    const [isExpanded, setIsExpanded] = useState(true);

    const adjustedValue = useMemo(() => {
        return baseValue * (1 + adjustPct / 100);
    }, [baseValue, adjustPct]);

    const delta = adjustedValue - baseValue;
    const deltaPct = baseValue !== 0 ? ((delta / baseValue) * 100).toFixed(1) : '0';

    // Apply multiplier to forecast values
    const adjustedForecast = useMemo(() => {
        if (!forecastValues) return null;
        const multiplier = 1 + adjustPct / 100;
        return forecastValues.map(v => v * multiplier);
    }, [forecastValues, adjustPct]);

    const formatValue = (val: number): string => {
        const abs = Math.abs(val);
        if (abs >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + 'B';
        if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
        if (abs >= 1_000) return (val / 1_000).toFixed(1) + 'K';
        return val.toFixed(0);
    };

    const scenarios = [
        { label: 'Pessimistic', pct: -15, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Base Case', pct: 0, color: 'text-(--foreground)', bg: 'bg-(--brand-primary)/10' },
        { label: 'Optimistic', pct: 15, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="paper-sheet overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-(--surface-hover) transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-(--brand-secondary) uppercase tracking-widest">
                        🔮 What-If Simulation
                    </span>
                    {adjustPct !== 0 && (
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${adjustPct > 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                            {adjustPct > 0 ? '+' : ''}{adjustPct}%
                        </span>
                    )}
                </div>
                <span className={`text-(--brand-secondary) text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Main Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-(--brand-secondary) uppercase">Adjustment</span>
                            <span className={`font-mono text-sm font-black ${adjustPct > 0 ? 'text-emerald-500' : adjustPct < 0 ? 'text-rose-500' : 'text-(--foreground)'}`}>
                                {adjustPct > 0 ? '+' : ''}{adjustPct}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={-50}
                            max={50}
                            step={1}
                            value={adjustPct}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setAdjustPct(val);
                                onScenarioChange?.(1 + val / 100);
                            }}
                            className="w-full accent-(--brand-primary)"
                        />
                        <div className="flex justify-between font-mono text-[8px] text-(--brand-secondary)">
                            <span>-50%</span>
                            <span>0%</span>
                            <span>+50%</span>
                        </div>
                    </div>

                    {/* Base vs Adjusted comparison */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-(--surface) border border-(--border-color) rounded p-3 text-center">
                            <span className="font-mono text-[9px] text-(--brand-secondary) uppercase block mb-1">Base Case</span>
                            <span className="font-mono text-lg font-black text-(--foreground)">{formatValue(baseValue)}</span>
                        </div>
                        <div className={`border rounded p-3 text-center ${adjustPct > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : adjustPct < 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-(--border-color) bg-(--surface)'}`}>
                            <span className="font-mono text-[9px] text-(--brand-secondary) uppercase block mb-1">Adjusted</span>
                            <span className={`font-mono text-lg font-black ${adjustPct > 0 ? 'text-emerald-500' : adjustPct < 0 ? 'text-rose-500' : 'text-(--foreground)'}`}>
                                {formatValue(adjustedValue)}
                            </span>
                            {adjustPct !== 0 && (
                                <span className={`font-mono text-[10px] block mt-0.5 ${delta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {delta > 0 ? '▲' : '▼'} {formatValue(Math.abs(delta))} ({deltaPct}%)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Quick Scenario Buttons */}
                    <div className="flex gap-2">
                        {scenarios.map(s => (
                            <button
                                key={s.label}
                                onClick={() => {
                                    setAdjustPct(s.pct);
                                    onScenarioChange?.(1 + s.pct / 100);
                                }}
                                className={`flex-1 ${s.bg} ${s.color} font-mono text-[9px] px-2 py-2 rounded font-bold uppercase transition-all hover:opacity-80 ${adjustPct === s.pct ? 'ring-2 ring-(--brand-primary) shadow-sm' : ''}`}
                            >
                                {s.label}
                                <br />
                                <span className="text-[8px] opacity-70">
                                    {s.pct > 0 ? '+' : ''}{s.pct}%
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Adjusted Forecast Preview */}
                    {adjustedForecast && forecastDates && adjustPct !== 0 && (
                        <div className="border-t border-(--border-color) pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[9px] text-(--brand-secondary) uppercase font-bold">Adjusted Forecast</span>
                                <TechnicalBadge text="SIMULATION" status="warning" />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                {adjustedForecast.slice(-3).map((val, i) => {
                                    const dateIdx = forecastDates.length - 3 + i;
                                    const date = forecastDates[dateIdx] || `T+${i+1}`;
                                    return (
                                        <div key={i} className="bg-(--surface) border border-(--border-color) rounded p-2 text-center">
                                            <span className="font-mono text-[8px] text-(--brand-secondary) block">{date}</span>
                                            <span className="font-mono text-xs font-bold text-(--foreground)">{formatValue(val)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
