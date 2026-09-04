"use client";

import React, { useMemo } from 'react';
import { useTheme } from './ThemeContext';

interface PivotTableProps {
    data: any[];
    rowKey: string;
    colKey: string;
    valueKey: string;
    title?: string;
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

function formatCellValue(val: number | null | undefined): string {
    if (val == null || isNaN(val)) return '—';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return (val / 1_000).toFixed(1) + 'K';
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toFixed(1);
}

function getHeatColor(val: number, min: number, max: number, isDark: boolean): string {
    if (max === min) return 'transparent';
    const ratio = (val - min) / (max - min);
    // Blue intensity scale (blueprint theme)
    const alpha = 0.05 + ratio * 0.25;
    return isDark
        ? `rgba(96, 165, 250, ${alpha})`
        : `rgba(37, 99, 235, ${alpha})`;
}

export default function PivotTable({ data, rowKey, colKey, valueKey, title, aggregate = 'sum' }: PivotTableProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const { matrix, rowLabels, colLabels, rowTotals, colTotals, grandTotal, minVal, maxVal } = useMemo(() => {
        // Build pivot matrix
        const matrixMap: Record<string, Record<string, { sum: number; count: number; min: number; max: number }>> = {};
        const rowSet = new Set<string>();
        const colSet = new Set<string>();

        for (const row of data) {
            const rKey = String(row[rowKey] ?? '—');
            const cKey = String(row[colKey] ?? '—');
            const val = typeof row[valueKey] === 'number' ? row[valueKey] : parseFloat(row[valueKey]);
            if (isNaN(val)) continue;

            rowSet.add(rKey);
            colSet.add(cKey);

            if (!matrixMap[rKey]) matrixMap[rKey] = {};
            if (!matrixMap[rKey][cKey]) matrixMap[rKey][cKey] = { sum: 0, count: 0, min: Infinity, max: -Infinity };

            matrixMap[rKey][cKey].sum += val;
            matrixMap[rKey][cKey].count += 1;
            matrixMap[rKey][cKey].min = Math.min(matrixMap[rKey][cKey].min, val);
            matrixMap[rKey][cKey].max = Math.max(matrixMap[rKey][cKey].max, val);
        }

        const rowLabels = Array.from(rowSet).sort();
        const colLabels = Array.from(colSet).sort();

        // Resolve aggregate values
        const getVal = (cell: { sum: number; count: number; min: number; max: number } | undefined): number | null => {
            if (!cell) return null;
            switch (aggregate) {
                case 'avg': return cell.count > 0 ? cell.sum / cell.count : null;
                case 'count': return cell.count;
                case 'min': return cell.min === Infinity ? null : cell.min;
                case 'max': return cell.max === -Infinity ? null : cell.max;
                default: return cell.sum;
            }
        };

        const matrix: (number | null)[][] = rowLabels.map(r =>
            colLabels.map(c => getVal(matrixMap[r]?.[c]))
        );

        // Row totals
        const rowTotals = matrix.map(row => {
            let total = 0;
            for (const v of row) total += v ?? 0;
            return total;
        });
        // Column totals
        const colTotals = colLabels.map((_, ci) => {
            let total = 0;
            for (const row of matrix) total += row[ci] ?? 0;
            return total;
        });
        let grandTotal = 0;
        for (const t of rowTotals) grandTotal += t;

        // Min/max for heatmap
        const allVals = matrix.flat().filter((v): v is number => v != null);
        const minVal = allVals.length > 0 ? Math.min(...allVals) : 0;
        const maxVal = allVals.length > 0 ? Math.max(...allVals) : 1;

        return { matrix, rowLabels, colLabels, rowTotals, colTotals, grandTotal, minVal, maxVal };
    }, [data, rowKey, colKey, valueKey, aggregate]);

    if (rowLabels.length === 0 || colLabels.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-(--brand-secondary) font-bold uppercase text-xs font-mono">
                NO PIVOT DATA — Need both row and column dimensions
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col font-mono text-xs overflow-hidden">
            {title && (
                <h3 className="text-sm font-bold text-(--foreground) uppercase tracking-widest mb-2">{title}</h3>
            )}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse min-w-max">
                    <thead>
                        <tr>
                            <th className="sticky top-0 left-0 z-20 bg-(--surface) text-[10px] text-(--brand-secondary) uppercase tracking-wider p-2 text-left border-b-2 border-(--border-color)">
                                {rowKey} \ {colKey}
                            </th>
                            {colLabels.map(col => (
                                <th key={col} className="sticky top-0 z-10 bg-(--surface) text-[10px] text-(--brand-secondary) uppercase tracking-wider p-2 text-right border-b-2 border-(--border-color) whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                            <th className="sticky top-0 z-10 bg-(--surface) text-[10px] font-black text-(--foreground) uppercase tracking-wider p-2 text-right border-b-2 border-(--border-color) border-l-2">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowLabels.map((row, ri) => (
                            <tr key={row} className="hover:bg-(--surface-hover) transition-colors">
                                <td className="sticky left-0 bg-(--surface) text-[11px] font-bold text-(--foreground) p-2 border-b border-(--border-color) whitespace-nowrap">
                                    {row}
                                </td>
                                {matrix[ri].map((val, ci) => (
                                    <td
                                        key={ci}
                                        className="text-[11px] text-(--foreground) p-2 text-right border-b border-(--border-color) tabular-nums"
                                        style={{ backgroundColor: val != null ? getHeatColor(val, minVal, maxVal, !!isDark) : 'transparent' }}
                                    >
                                        {val != null ? formatCellValue(val) : '—'}
                                    </td>
                                ))}
                                <td className="text-[11px] font-bold text-(--foreground) p-2 text-right border-b border-(--border-color) border-l-2 tabular-nums bg-(--surface)/80">
                                    {formatCellValue(rowTotals[ri])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-(--border-color)">
                            <td className="sticky left-0 bg-(--surface) text-[10px] font-black text-(--foreground) uppercase p-2">
                                Total
                            </td>
                            {colTotals.map((ct, ci) => (
                                <td key={ci} className="text-[11px] font-bold text-(--foreground) p-2 text-right tabular-nums bg-(--surface)/80">
                                    {formatCellValue(ct)}
                                </td>
                            ))}
                            <td className="text-[11px] font-black text-(--foreground) p-2 text-right border-l-2 tabular-nums bg-(--brand-primary)/10">
                                {formatCellValue(grandTotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
