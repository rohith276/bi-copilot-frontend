"use client";

import { useState, useEffect, useCallback } from "react";
import { IsometricCube } from "@/components/PaperAccents";
import Visualizer, { CHART_TYPE_OPTIONS, type ChartType } from "@/components/Visualizer";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import CalculatedFieldsPanel from "./CalculatedFieldsPanel";

interface DatasetStats {
    name: string;
    bi_type: string;
}

type Granularity = "day" | "week" | "month" | "quarter" | "year";
type SortOrder = "asc" | "desc" | null;

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
];

export default function VisualBuilder({ datasetId }: { datasetId: number }) {
    const [stats, setStats] = useState<DatasetStats[] | null>(null);
    const [loading, setLoading] = useState(true);

    const [xAxis, setXAxis] = useState<string | null>(null);
    const [yAxis, setYAxis] = useState<string | null>(null);
    const [aggregate, setAggregate] = useState<string>("sum");
    const [chartType, setChartType] = useState<ChartType>("bar");
    
    const [queryData, setQueryData] = useState<any>(null);
    const [querying, setQuerying] = useState(false);
    const [drillPath, setDrillPath] = useState<{ column: string; value: string }[]>([]);
    const { addToast } = useToast();

    // ── Data Scope filter state ──────────────────────────────────────
    const [granularity, setGranularity] = useState<Granularity | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [topN, setTopN] = useState<number | null>(null);
    const [rangeMin, setRangeMin] = useState<string>("");
    const [rangeMax, setRangeMax] = useState<string>("");
    const [scopeExpanded, setScopeExpanded] = useState(true);

    // ── Metadata from backend response ───────────────────────────────
    const [xColumnType, setXColumnType] = useState<string | null>(null);
    const [availableRange, setAvailableRange] = useState<{ min: string; max: string } | null>(null);
    const [appliedGranularity, setAppliedGranularity] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiFetch(`/datasets/${datasetId}/stats`);
                setStats(data);
            } catch (error) {
                console.error("Failed to load schema", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [datasetId]);

    // Reset scope filters when x-axis changes
    useEffect(() => {
        setGranularity(null);
        setRangeMin("");
        setRangeMax("");
        setTopN(null);
        setSortOrder(null);
        setXColumnType(null);
        setAvailableRange(null);
        setAppliedGranularity(null);
    }, [xAxis]);

    useEffect(() => {
        if (xAxis && yAxis) {
            executeQuery();
        }
    }, [xAxis, yAxis, aggregate, drillPath, chartType, granularity, sortOrder, topN, rangeMin, rangeMax]);

    const executeQuery = useCallback(async () => {
        setQuerying(true);
        try {
            const data = await apiFetch(`/analytics/${datasetId}/visual-query`, {
                method: "POST",
                body: JSON.stringify({
                    x_axis: xAxis,
                    y_axis: yAxis,
                    aggregate,
                    filters: drillPath.map(d => ({ column: d.column, value: d.value })),
                    chart_type: chartType,
                    date_granularity: granularity || undefined,
                    sort_order: sortOrder || undefined,
                    limit: topN || undefined,
                    range_min: rangeMin || undefined,
                    range_max: rangeMax || undefined,
                })
            });
            setQueryData(data);
            // Update metadata from response
            if (data.x_column_type) setXColumnType(data.x_column_type);
            if (data.available_range) setAvailableRange(data.available_range);
            if (data.applied_granularity) setAppliedGranularity(data.applied_granularity);
        } catch (err) {
            console.error("Failed to execute visual query", err);
        } finally {
            setQuerying(false);
        }
    }, [datasetId, xAxis, yAxis, aggregate, drillPath, chartType, granularity, sortOrder, topN, rangeMin, rangeMax]);

    const handleDragStart = (e: React.DragEvent, colName: string, biType: string) => {
        e.dataTransfer.setData("colName", colName);
        e.dataTransfer.setData("biType", biType);
    };

    const handleDropX = (e: React.DragEvent) => {
        e.preventDefault();
        const colName = e.dataTransfer.getData("colName");
        if (colName) setXAxis(colName);
    };

    const handleDropY = (e: React.DragEvent) => {
        e.preventDefault();
        const colName = e.dataTransfer.getData("colName");
        const biType = e.dataTransfer.getData("biType");
        if (biType === "dimension") {
            setAggregate("count");
        }
        if (colName) setYAxis(colName);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <IsometricCube className="w-16 h-16 text-brand-primary animate-pulse" />
                <p className="mt-4 font-mono text-brand-secondary text-sm">Loading Schema...</p>
            </div>
        );
    }

    const dimensions = stats?.filter(s => s.bi_type === "dimension" || s.bi_type === "datetime") || [];
    const metrics = stats?.filter(s => s.bi_type === "metric") || [];

    const handlePin = async () => {
        try {
            await apiFetch(`/dashboards/${datasetId}/pin`, {
                method: "POST",
                body: JSON.stringify({
                    title: `${aggregate.toUpperCase()}(${yAxis}) by ${xAxis}`,
                    sql_query: queryData.sql_query,
                    chart_config: {
                        type: chartType,
                        labelCol: xAxis,
                        valueCol: 'agg_value'
                    },
                    layout: { w: 6, h: 4, x: 0, y: 0 }
                })
            });
            addToast('Pinned to dashboard successfully!', 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to pin to dashboard', 'error');
        }
    };

    const isDateAxis = xColumnType === "date";
    const hasData = queryData?.result?.data?.length > 0;
    const totalRowsBeforeLimit = queryData?.result?.total_rows || 0;
    const displayedRows = queryData?.result?.data?.length || 0;

    return (
        <div className="flex gap-4 h-full">
            {/* Left Sidebar - Data Dictionary */}
            <div className="w-52 shrink-0 flex flex-col gap-0 max-h-[calc(100vh-12rem)]">
                <div className="paper-sheet p-3 overflow-y-auto custom-scrollbar flex-1">
                    <h3 className="font-mono text-[10px] font-bold text-(--brand-secondary) uppercase mb-2 border-b border-(--border-color) pb-1.5 sticky top-0 bg-(--surface) z-10">
                        Dimensions (Categories)
                    </h3>
                    <div className="flex flex-col gap-1 mb-4">
                        {dimensions.map(col => (
                            <div
                                key={col.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, col.name, col.bi_type)}
                                className="bg-(--surface) border border-(--border-color) px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-(--brand-primary) transition-colors flex items-center justify-between group"
                            >
                                <span className="font-mono text-[11px] text-(--foreground) truncate">{col.name}</span>
                                <span className="text-[9px] text-(--brand-secondary) font-mono opacity-50">ABC</span>
                            </div>
                        ))}
                    </div>

                    <h3 className="font-mono text-[10px] font-bold text-(--brand-secondary) uppercase mb-2 border-b border-(--border-color) pb-1.5 sticky top-0 bg-(--surface) z-10">
                        Metrics (Values)
                    </h3>
                    <div className="flex flex-col gap-1">
                        {metrics.map(col => (
                            <div
                                key={col.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, col.name, col.bi_type)}
                                className="bg-(--surface) border border-emerald-500/30 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-emerald-500 transition-colors flex items-center justify-between group"
                            >
                                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate">{col.name}</span>
                                <span className="text-[9px] text-emerald-500 font-mono opacity-50">123</span>
                            </div>
                        ))}
                    </div>

                    {/* Calculated Fields */}
                    <CalculatedFieldsPanel
                        datasetId={datasetId}
                        columns={[...dimensions.map(d => d.name), ...metrics.map(m => m.name)]}
                        onFieldsChange={() => {}}
                    />
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col gap-3">
                {/* Controls Bar: Drop Zones + Chart Type Selector */}
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                    {/* X-Axis drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropX}
                        className={`paper-sheet p-3 border-2 border-dashed ${xAxis ? 'border-(--brand-primary) bg-(--brand-primary)/5' : 'border-(--border-color) bg-(--surface)'} flex flex-col items-center justify-center transition-colors min-h-16`}
                    >
                        <span className="font-mono text-[10px] text-(--brand-secondary) uppercase mb-1">X-Axis / Group By</span>
                        {xAxis ? (
                            <div className="bg-(--foreground) text-(--background) font-mono text-[11px] px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 border border-(--border-color)">
                                <span className="font-bold">{xAxis}</span>
                                <button onClick={() => setXAxis(null)} className="hover:text-rose-400 text-sm leading-none">×</button>
                            </div>
                        ) : (
                            <span className="text-xs font-mono text-(--border-color)">Drop Dimension</span>
                        )}
                    </div>

                    {/* Y-Axis drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropY}
                        className={`paper-sheet p-3 border-2 border-dashed ${yAxis ? 'border-emerald-500 bg-emerald-500/5' : 'border-(--border-color) bg-(--surface)'} flex flex-col items-center justify-center transition-colors min-h-16`}
                    >
                        <span className="font-mono text-[10px] text-(--brand-secondary) uppercase mb-1">Y-Axis / Metric</span>
                        {yAxis ? (
                            <div className="flex items-center gap-1.5">
                                <select 
                                    className="bg-transparent border border-(--border-color) font-mono text-[11px] p-0.5 rounded text-(--foreground) outline-none focus:border-(--brand-primary)"
                                    value={aggregate}
                                    onChange={(e) => setAggregate(e.target.value)}
                                >
                                    <option value="sum">SUM</option>
                                    <option value="avg">AVG</option>
                                    <option value="min">MIN</option>
                                    <option value="max">MAX</option>
                                    <option value="count">COUNT</option>
                                </select>
                                <div className="bg-emerald-600 text-white font-mono text-[11px] px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5">
                                    <span className="font-bold">{yAxis}</span>
                                    <button onClick={() => setYAxis(null)} className="hover:text-red-200 text-sm leading-none">×</button>
                                </div>
                            </div>
                        ) : (
                            <span className="text-xs font-mono text-(--border-color)">Drop Metric</span>
                        )}
                    </div>

                    {/* Chart Type Selector */}
                    <div className="paper-sheet p-2 flex flex-col justify-center">
                        <span className="font-mono text-[9px] text-(--brand-secondary) uppercase text-center mb-1 tracking-wider">Chart Type</span>
                        <div className="grid grid-cols-3 gap-0.5">
                            {CHART_TYPE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setChartType(opt.value)}
                                    title={opt.label}
                                    className={`
                                        flex flex-col items-center justify-center p-1 rounded transition-all text-[10px] font-mono
                                        ${chartType === opt.value 
                                            ? 'bg-(--brand-primary) text-white shadow-sm scale-105' 
                                            : 'text-(--brand-secondary) hover:bg-(--surface-hover) hover:text-(--foreground)'
                                        }
                                    `}
                                >
                                    <span className="text-sm leading-none">{opt.icon}</span>
                                    <span className="text-[8px] mt-0.5 leading-none">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── DATA SCOPE TOOLBAR ─────────────────────────────────────── */}
                {xAxis && yAxis && (
                    <div className="paper-sheet overflow-hidden transition-all duration-300">
                        {/* Header — always visible */}
                        <button
                            onClick={() => setScopeExpanded(!scopeExpanded)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-(--surface-hover) transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-(--brand-secondary) uppercase tracking-widest">
                                    ⊞ Data Scope
                                </span>
                                {/* Active filter indicators */}
                                {(granularity || topN || rangeMin || rangeMax || sortOrder) && (
                                    <div className="flex items-center gap-1">
                                        {appliedGranularity && (
                                            <span className="bg-(--brand-primary)/15 text-(--brand-primary) font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                {appliedGranularity}
                                            </span>
                                        )}
                                        {topN && (
                                            <span className="bg-amber-500/15 text-amber-600 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                                                Top {topN}
                                            </span>
                                        )}
                                        {(rangeMin || rangeMax) && (
                                            <span className="bg-emerald-500/15 text-emerald-600 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                                                Range
                                            </span>
                                        )}
                                        {sortOrder && (
                                            <span className="bg-purple-500/15 text-purple-600 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                {sortOrder}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className={`text-(--brand-secondary) text-xs transition-transform duration-200 ${scopeExpanded ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>

                        {/* Collapsible body */}
                        {scopeExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-(--border-color) space-y-3">
                                {/* Row 1: Granularity (date only) + Sort */}
                                <div className="flex items-end gap-4 flex-wrap">
                                    {/* Date Granularity Pills */}
                                    {isDateAxis && (
                                        <div className="flex-1 min-w-50">
                                            <label className="block font-mono text-[9px] font-bold text-(--brand-secondary) uppercase tracking-widest mb-1.5">
                                                Granularity
                                            </label>
                                            <div className="flex gap-1">
                                                {GRANULARITY_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setGranularity(
                                                            granularity === opt.value ? null : opt.value
                                                        )}
                                                        className={`
                                                            font-mono text-[10px] px-2.5 py-1.5 rounded transition-all font-bold uppercase tracking-wider
                                                            ${(granularity || appliedGranularity) === opt.value
                                                                ? 'bg-(--brand-primary) text-white shadow-sm'
                                                                : 'bg-(--surface) border border-(--border-color) text-(--brand-secondary) hover:border-(--brand-primary) hover:text-(--foreground)'
                                                            }
                                                        `}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sort Control */}
                                    <div className="min-w-30">
                                        <label className="block font-mono text-[9px] font-bold text-(--brand-secondary) uppercase tracking-widest mb-1.5">
                                            Sort by Metric
                                        </label>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setSortOrder(sortOrder === "desc" ? null : "desc")}
                                                className={`
                                                    font-mono text-[10px] px-2.5 py-1.5 rounded transition-all font-bold
                                                    ${sortOrder === "desc"
                                                        ? 'bg-purple-600 text-white shadow-sm'
                                                        : 'bg-(--surface) border border-(--border-color) text-(--brand-secondary) hover:border-purple-500 hover:text-(--foreground)'
                                                    }
                                                `}
                                            >
                                                ↓ High
                                            </button>
                                            <button
                                                onClick={() => setSortOrder(sortOrder === "asc" ? null : "asc")}
                                                className={`
                                                    font-mono text-[10px] px-2.5 py-1.5 rounded transition-all font-bold
                                                    ${sortOrder === "asc"
                                                        ? 'bg-purple-600 text-white shadow-sm'
                                                        : 'bg-(--surface) border border-(--border-color) text-(--brand-secondary) hover:border-purple-500 hover:text-(--foreground)'
                                                    }
                                                `}
                                            >
                                                ↑ Low
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Range Filter + Top N */}
                                <div className="flex items-end gap-4 flex-wrap">
                                    {/* Date Range */}
                                    {isDateAxis && (
                                        <div className="flex-1 min-w-70">
                                            <label className="block font-mono text-[9px] font-bold text-(--brand-secondary) uppercase tracking-widest mb-1.5">
                                                Date Range
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={rangeMin}
                                                    min={availableRange?.min}
                                                    max={availableRange?.max}
                                                    onChange={(e) => setRangeMin(e.target.value)}
                                                    className="bg-(--surface) border border-(--border-color) font-mono text-[10px] px-2 py-1.5 rounded text-(--foreground) outline-none focus:border-(--brand-primary) w-36"
                                                    placeholder="Start"
                                                />
                                                <span className="font-mono text-[10px] text-(--brand-secondary) font-bold">→</span>
                                                <input
                                                    type="date"
                                                    value={rangeMax}
                                                    min={availableRange?.min}
                                                    max={availableRange?.max}
                                                    onChange={(e) => setRangeMax(e.target.value)}
                                                    className="bg-(--surface) border border-(--border-color) font-mono text-[10px] px-2 py-1.5 rounded text-(--foreground) outline-none focus:border-(--brand-primary) w-36"
                                                    placeholder="End"
                                                />
                                                {(rangeMin || rangeMax) && (
                                                    <button
                                                        onClick={() => { setRangeMin(""); setRangeMax(""); }}
                                                        className="text-rose-500 hover:text-rose-400 font-mono text-[10px] font-bold px-1.5 py-1 rounded hover:bg-rose-500/10 transition-colors"
                                                        title="Clear range"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            {availableRange && (
                                                <p className="font-mono text-[8px] text-(--brand-secondary) mt-1 opacity-60">
                                                    Available: {availableRange.min} → {availableRange.max}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Top N Control */}
                                    <div className="min-w-40">
                                        <label className="block font-mono text-[9px] font-bold text-(--brand-secondary) uppercase tracking-widest mb-1.5">
                                            Limit Results
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[10px] text-(--brand-secondary) font-bold">Top</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={1000}
                                                value={topN || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value ? parseInt(e.target.value) : null;
                                                    setTopN(val && val > 0 ? val : null);
                                                }}
                                                placeholder="All"
                                                className="bg-(--surface) border border-(--border-color) font-mono text-[10px] px-2 py-1.5 rounded text-(--foreground) outline-none focus:border-(--brand-primary) w-16 text-center"
                                            />
                                            <span className="font-mono text-[9px] text-(--brand-secondary)">results</span>
                                            {topN && (
                                                <button
                                                    onClick={() => setTopN(null)}
                                                    className="text-rose-500 hover:text-rose-400 font-mono text-[10px] font-bold px-1 rounded hover:bg-rose-500/10 transition-colors"
                                                    title="Show all"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Presets */}
                                    <div className="min-w-25">
                                        <label className="block font-mono text-[9px] font-bold text-(--brand-secondary) uppercase tracking-widest mb-1.5">
                                            Quick Set
                                        </label>
                                        <div className="flex gap-1">
                                            {[5, 10, 25].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setTopN(topN === n ? null : n)}
                                                    className={`
                                                        font-mono text-[9px] px-2 py-1.5 rounded transition-all font-bold
                                                        ${topN === n
                                                            ? 'bg-amber-500 text-white shadow-sm'
                                                            : 'bg-(--surface) border border-(--border-color) text-(--brand-secondary) hover:border-amber-500 hover:text-(--foreground)'
                                                        }
                                                    `}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Active filters summary */}
                                {totalRowsBeforeLimit > 0 && displayedRows < totalRowsBeforeLimit && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-(--border-color)">
                                        <span className="font-mono text-[9px] text-amber-600 font-bold uppercase">
                                            ⚡ Showing {displayedRows} of {totalRowsBeforeLimit} groups
                                        </span>
                                        <button
                                            onClick={() => {
                                                setGranularity(null);
                                                setTopN(null);
                                                setRangeMin("");
                                                setRangeMax("");
                                                setSortOrder(null);
                                            }}
                                            className="font-mono text-[9px] text-rose-500 hover:text-rose-400 font-bold uppercase hover:underline"
                                        >
                                            Reset All
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Canvas Area */}
                <div className="paper-sheet flex-1 p-4 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.15, pointerEvents: 'none' }} />
                    
                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <h2 className="text-base font-mono font-black text-(--foreground) flex items-center gap-2">
                            VISUAL CANVAS
                            {querying && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                        </h2>
                        {queryData && (
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-(--brand-secondary)">
                                    {displayedRows}{totalRowsBeforeLimit > displayedRows ? ` / ${totalRowsBeforeLimit}` : ''} rows
                                </span>
                                {appliedGranularity && (
                                    <span className="font-mono text-[9px] bg-(--brand-primary)/10 text-(--brand-primary) px-1.5 py-0.5 rounded font-bold uppercase">
                                        by {appliedGranularity}
                                    </span>
                                )}
                                <button onClick={handlePin} className="bg-(--brand-primary) text-white font-mono text-[10px] px-3 py-1.5 rounded hover:opacity-90 transition-opacity uppercase tracking-wider flex items-center gap-1.5">
                                    📌 Pin to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 relative z-10 bg-(--surface)/80 backdrop-blur-sm border border-(--border-color) rounded p-3 flex items-center justify-center min-h-87.5">
                        {!xAxis || !yAxis ? (
                            <div className="text-center">
                                <IsometricCube className="w-20 h-20 mx-auto text-(--border-color) mb-3" />
                                <p className="font-mono text-(--brand-secondary) text-sm">Drag columns to X and Y axes to generate visual</p>
                                <p className="font-mono text-(--brand-secondary) text-[10px] mt-1 opacity-60">Select a chart type from the picker above</p>
                            </div>
                        ) : queryData ? (
                            <Visualizer 
                                data={queryData.result.data}
                                type={chartType}
                                labelKey={xAxis}
                                valueKey="agg_value"
                                title={`${aggregate.toUpperCase()}(${yAxis}) by ${xAxis}${appliedGranularity ? ` [${appliedGranularity}]` : ''}`}
                                onDrillDown={(label) => {
                                    setDrillPath(prev => [...prev, { column: xAxis, value: label }]);
                                }}
                            />
                        ) : (
                            <p className="font-mono text-(--brand-secondary) animate-pulse">Compiling query...</p>
                        )}
                    </div>
                    
                    {queryData && (
                        <div className="mt-3 relative z-10 space-y-2">
                            {/* Drill-down breadcrumbs */}
                            {drillPath.length > 0 && (
                                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                    <button
                                        onClick={() => setDrillPath([])}
                                        className="text-(--brand-primary) hover:underline font-bold"
                                    >
                                        All
                                    </button>
                                    {drillPath.map((crumb, i) => (
                                        <span key={i} className="flex items-center gap-1.5">
                                            <span className="text-(--brand-secondary)">→</span>
                                            <button
                                                onClick={() => setDrillPath(prev => prev.slice(0, i + 1))}
                                                className={`font-bold ${i === drillPath.length - 1 ? 'text-(--foreground)' : 'text-(--brand-primary) hover:underline'}`}
                                            >
                                                {crumb.column}={crumb.value}
                                            </button>
                                        </span>
                                    ))}
                                    <button
                                        onClick={() => setDrillPath(prev => prev.slice(0, -1))}
                                        className="ml-2 bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded text-[9px] hover:bg-rose-500/20 transition-colors uppercase"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}
                            <div className="bg-(--brand-primary)/10 border border-(--brand-primary)/30 p-2.5 rounded font-mono text-[10px] text-(--foreground) flex items-center gap-2">
                                <span className="text-(--brand-primary) font-bold shrink-0">SQL:</span>
                                <code className="truncate opacity-75">{queryData.sql_query}</code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
