"use client";

import React, { useMemo } from 'react';
import Visualizer, { type ChartType } from './Visualizer';

interface SmallMultiplesProps {
    data: any[];
    splitBy: string;
    labelKey: string;
    valueKey: string;
    chartType: ChartType;
    title?: string;
    columns?: number;  // Grid columns (default: auto based on count)
}

/**
 * SmallMultiples renders a grid of mini Visualizer charts,
 * one per unique value of the `splitBy` dimension.
 * All panels share the same Y-axis scale for fair comparison.
 */
export default function SmallMultiples({
    data,
    splitBy,
    labelKey,
    valueKey,
    chartType,
    title = '',
    columns,
}: SmallMultiplesProps) {
    const { panels, sharedMax } = useMemo(() => {
        // Group data by splitBy value
        const groups: Record<string, any[]> = {};
        for (const row of data) {
            const key = String(row[splitBy] ?? '—');
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        }

        const panelNames = Object.keys(groups).sort();

        // Calculate shared max for consistent Y-axis
        let globalMax = 0;
        for (const items of Object.values(groups)) {
            for (const item of items) {
                const val = Number(item[valueKey]) || 0;
                if (val > globalMax) globalMax = val;
            }
        }

        return {
            panels: panelNames.map(name => ({
                name,
                data: groups[name],
            })),
            sharedMax: globalMax,
        };
    }, [data, splitBy, valueKey, labelKey]);

    if (panels.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-(--brand-secondary) font-bold uppercase text-xs font-mono">
                NO DATA — Drop a dimension into Split By
            </div>
        );
    }

    // Auto-calculate grid columns
    const gridCols = columns || (panels.length <= 2 ? 2 : panels.length <= 4 ? 2 : panels.length <= 6 ? 3 : 4);

    return (
        <div className="w-full h-full flex flex-col font-mono text-xs overflow-hidden">
            {title && (
                <h3 className="text-sm font-bold text-(--foreground) uppercase tracking-widest mb-2">{title}</h3>
            )}
            <div
                className="flex-1 grid gap-3 overflow-auto"
                style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
            >
                {panels.map(panel => (
                    <div
                        key={panel.name}
                        className="paper-sheet p-2 flex flex-col min-h-48 relative overflow-hidden"
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between mb-1 pb-1 border-b border-(--border-color)">
                            <span className="font-mono text-[10px] font-bold text-(--foreground) uppercase tracking-wider truncate">
                                {panel.name}
                            </span>
                            <span className="font-mono text-[9px] text-(--brand-secondary)">
                                {panel.data.length} pts
                            </span>
                        </div>
                        {/* Mini chart */}
                        <div className="flex-1 min-h-0">
                            <Visualizer
                                type={chartType}
                                data={panel.data}
                                labelKey={labelKey}
                                valueKey={valueKey}
                                title=""
                                showXAxis={false}
                                showGridLines={false}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
