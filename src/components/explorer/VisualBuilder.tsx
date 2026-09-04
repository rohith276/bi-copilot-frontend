"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { IsometricCube } from "@/components/PaperAccents";
import Visualizer, { CHART_TYPE_OPTIONS, type ChartType } from "@/components/Visualizer";
import SmallMultiples from "@/components/SmallMultiples";
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

function getSavedDraft(datasetId: number) {
    if (typeof window === "undefined") return null;
    try {
        const item = localStorage.getItem(`bi_builder_draft_${datasetId}`);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
}

export default function VisualBuilder({ datasetId }: { datasetId: number }) {
    const [stats, setStats] = useState<DatasetStats[] | null>(null);
    const [loading, setLoading] = useState(true);

    const savedDraft = typeof window !== "undefined" ? getSavedDraft(datasetId) : null;

    const [xAxis, setXAxis] = useState<string | null>(() => savedDraft?.xAxis ?? null);
    const [yAxis, setYAxis] = useState<string | null>(() => savedDraft?.yAxis ?? null);
    const [aggregate, setAggregate] = useState<string>(() => savedDraft?.aggregate ?? "sum");
    const [chartType, setChartType] = useState<ChartType>(() => savedDraft?.chartType ?? "bar");
    const [colorBy, setColorBy] = useState<string | null>(() => savedDraft?.colorBy ?? null);
    const [stackMode, setStackMode] = useState<'stacked' | 'grouped'>(() => savedDraft?.stackMode ?? 'stacked');
    
    const [queryData, setQueryData] = useState<any>(null);
    const [querying, setQuerying] = useState(false);
    const [drillPath, setDrillPath] = useState<{ column: string; value: string }[]>([]);
    const { addToast } = useToast();

    // ── Data Scope filter state ──────────────────────────────────────
    const [granularity, setGranularity] = useState<Granularity | null>(() => savedDraft?.granularity ?? null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(() => savedDraft?.sortOrder ?? null);
    const [topN, setTopN] = useState<number | null>(() => savedDraft?.topN ?? null);
    const [rangeMin, setRangeMin] = useState<string>(() => savedDraft?.rangeMin ?? "");
    const [rangeMax, setRangeMax] = useState<string>(() => savedDraft?.rangeMax ?? "");
    const [scopeExpanded, setScopeExpanded] = useState(true);
    const [dimensionFilters, setDimensionFilters] = useState<Record<string, string[]>>(() => savedDraft?.dimensionFilters ?? {});

    // ── P4: Formatting state ─────────────────────────────────────────
    const [showDataLabels, setShowDataLabels] = useState(() => savedDraft?.showDataLabels ?? false);
    const [showXAxis, setShowXAxis] = useState(() => savedDraft?.showXAxis ?? true);
    const [showYAxis, setShowYAxis] = useState(() => savedDraft?.showYAxis ?? true);
    const [showGridLines, setShowGridLines] = useState(() => savedDraft?.showGridLines ?? true);
    const [markerSize, setMarkerSize] = useState<number>(() => savedDraft?.markerSize ?? 3);
    const [formatExpanded, setFormatExpanded] = useState(false);

    // ── P5: Small Multiples state ────────────────────────────────────
    const [splitBy, setSplitBy] = useState<string | null>(() => savedDraft?.splitBy ?? null);

    // ── P6: Tooltip Extras state ─────────────────────────────────────
    const [tooltipExtras, setTooltipExtras] = useState<string[]>(() => savedDraft?.tooltipExtras ?? []);

    // ── T2: AI Chart Suggestion state ───────────────────────────────
    const [aiSuggestReason, setAiSuggestReason] = useState<string | null>(null);
    const [aiSuggestLoading, setAiSuggestLoading] = useState(false);

    // ── Metadata from backend response ───────────────────────────────
    const [xColumnType, setXColumnType] = useState<string | null>(null);
    const [availableRange, setAvailableRange] = useState<{ min: string; max: string } | null>(null);
    const [appliedGranularity, setAppliedGranularity] = useState<string | null>(null);
    const [dimensionValues, setDimensionValues] = useState<Record<string, string[]>>({});

    const prevXAxisRef = useRef<string | null>(xAxis);

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

    // Restore draft if datasetId changes
    useEffect(() => {
        const draft = getSavedDraft(datasetId);
        if (draft) {
            setXAxis(draft.xAxis ?? null);
            setYAxis(draft.yAxis ?? null);
            setAggregate(draft.aggregate ?? "sum");
            setChartType(draft.chartType ?? "bar");
            setColorBy(draft.colorBy ?? null);
            setStackMode(draft.stackMode ?? "stacked");
            setGranularity(draft.granularity ?? null);
            setSortOrder(draft.sortOrder ?? null);
            setTopN(draft.topN ?? null);
            setRangeMin(draft.rangeMin ?? "");
            setRangeMax(draft.rangeMax ?? "");
            setDimensionFilters(draft.dimensionFilters ?? {});
            setShowDataLabels(draft.showDataLabels ?? false);
            setShowXAxis(draft.showXAxis ?? true);
            setShowYAxis(draft.showYAxis ?? true);
            setShowGridLines(draft.showGridLines ?? true);
            setMarkerSize(draft.markerSize ?? 3);
            setSplitBy(draft.splitBy ?? null);
            setTooltipExtras(draft.tooltipExtras ?? []);
            prevXAxisRef.current = draft.xAxis ?? null;
        }
    }, [datasetId]);

    // Reset scope filters ONLY when user actively changes x-axis to a different column
    useEffect(() => {
        if (prevXAxisRef.current !== undefined && prevXAxisRef.current !== xAxis) {
            setGranularity(null);
            setRangeMin("");
            setRangeMax("");
            setTopN(null);
            setSortOrder(null);
            setXColumnType(null);
            setAvailableRange(null);
            setAppliedGranularity(null);
            setDimensionFilters({});
            setDimensionValues({});
        }
        prevXAxisRef.current = xAxis;
    }, [xAxis]);

    // Persist draft configuration on change
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!xAxis && !yAxis) return;
        const draft = {
            xAxis,
            yAxis,
            aggregate,
            chartType,
            colorBy,
            stackMode,
            granularity,
            sortOrder,
            topN,
            rangeMin,
            rangeMax,
            dimensionFilters,
            showDataLabels,
            showXAxis,
            showYAxis,
            showGridLines,
            markerSize,
            splitBy,
            tooltipExtras,
        };
        try {
            localStorage.setItem(`bi_builder_draft_${datasetId}`, JSON.stringify(draft));
        } catch (e) {
            console.warn("Failed to persist visual builder draft", e);
        }
    }, [
        datasetId, xAxis, yAxis, aggregate, chartType, colorBy, stackMode,
        granularity, sortOrder, topN, rangeMin, rangeMax, dimensionFilters,
        showDataLabels, showXAxis, showYAxis, showGridLines, markerSize, splitBy, tooltipExtras
    ]);

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
                    dimension_filters: Object.keys(dimensionFilters).length > 0 ? dimensionFilters : undefined,
                    color_by: colorBy || undefined,
                    stack_mode: stackMode || undefined,
                })
            });
            setQueryData(data);
            // Update metadata from response
            if (data.x_column_type) setXColumnType(data.x_column_type);
            if (data.available_range) setAvailableRange(data.available_range);
            if (data.applied_granularity) setAppliedGranularity(data.applied_granularity);
            if (data.dimension_values) setDimensionValues(data.dimension_values);
        } catch (err) {
            console.error("Failed to execute visual query", err);
        } finally {
            setQuerying(false);
        }
    }, [datasetId, xAxis, yAxis, aggregate, drillPath, chartType, granularity, sortOrder, topN, rangeMin, rangeMax, dimensionFilters, colorBy, stackMode]);

    useEffect(() => {
        if (xAxis && yAxis) {
            executeQuery();
        }
    }, [xAxis, yAxis, aggregate, drillPath, chartType, granularity, sortOrder, topN, rangeMin, rangeMax, dimensionFilters, colorBy, stackMode, executeQuery]);

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

    const handleDropColor = (e: React.DragEvent) => {
        e.preventDefault();
        const colName = e.dataTransfer.getData("colName");
        if (colName) setColorBy(colName);
    };

    const handleDropSplit = (e: React.DragEvent) => {
        e.preventDefault();
        const colName = e.dataTransfer.getData("colName");
        if (colName) setSplitBy(colName);
    };

    const handleDropTooltipExtra = (e: React.DragEvent) => {
        e.preventDefault();
        const colName = e.dataTransfer.getData("colName");
        if (colName && !tooltipExtras.includes(colName)) {
            setTooltipExtras(prev => [...prev, colName]);
        }
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

    const handleResetCanvas = () => {
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(`bi_builder_draft_${datasetId}`);
            } catch {}
        }
        setXAxis(null);
        setYAxis(null);
        setAggregate("sum");
        setChartType("bar");
        setColorBy(null);
        setStackMode("stacked");
        setGranularity(null);
        setSortOrder(null);
        setTopN(null);
        setRangeMin("");
        setRangeMax("");
        setDimensionFilters({});
        setShowDataLabels(false);
        setShowXAxis(true);
        setShowYAxis(true);
        setShowGridLines(true);
        setMarkerSize(3);
        setSplitBy(null);
        setTooltipExtras([]);
        setDrillPath([]);
        setQueryData(null);
        prevXAxisRef.current = null;
        addToast("Canvas reset to clean state", "info");
    };

    const isDateAxis = xColumnType === "date" || appliedGranularity != null;
    const hasData = queryData?.result?.data?.length > 0;
    const totalRowsBeforeLimit = queryData?.result?.total_rows || 0;
    const displayedRows = queryData?.result?.data?.length || 0;

    return (
        <div className="flex gap-4 h-full">
            {/* Left Sidebar - Data Dictionary */}
            <div className="w-64 shrink-0 flex flex-col gap-0 max-h-[calc(100vh-12rem)]">
                <div className="paper-sheet p-3.5 overflow-y-auto custom-scrollbar flex-1">
                    <h3 className="font-mono text-xs font-bold text-(--brand-secondary) uppercase mb-2.5 border-b border-(--border-color) pb-1.5 sticky top-0 bg-(--surface) z-10 tracking-wider">
                        Dimensions (Categories)
                    </h3>
                    <div className="flex flex-col gap-1.5 mb-4">
                        {dimensions.map(col => (
                            <div
                                key={col.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, col.name, col.bi_type)}
                                className="bg-(--surface) border border-(--border-color) px-2.5 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-(--brand-primary) transition-colors flex items-center justify-between group"
                            >
                                <span className="font-mono text-xs text-(--foreground) font-medium truncate">{col.name}</span>
                                <span className="text-[10px] text-(--brand-secondary) font-mono opacity-60">ABC</span>
                            </div>
                        ))}
                    </div>

                    <h3 className="font-mono text-xs font-bold text-(--brand-secondary) uppercase mb-2.5 border-b border-(--border-color) pb-1.5 sticky top-0 bg-(--surface) z-10 tracking-wider">
                        Metrics (Values)
                    </h3>
                    <div className="flex flex-col gap-1.5">
                        {metrics.map(col => (
                            <div
                                key={col.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, col.name, col.bi_type)}
                                className="bg-(--surface) border border-emerald-500/30 px-2.5 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-emerald-500 transition-colors flex items-center justify-between group"
                            >
                                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate">{col.name}</span>
                                <span className="text-[10px] text-emerald-500 font-mono opacity-60">123</span>
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
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3">
                    {/* X-Axis drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropX}
                        className={`paper-sheet p-3 border-2 border-dashed ${xAxis ? 'border-(--brand-primary) bg-(--brand-primary)/5' : 'border-(--border-color) bg-(--surface)'} flex flex-col items-center justify-center transition-colors min-h-16`}
                    >
                        <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase mb-1.5 tracking-wider">X-Axis / Group By</span>
                        {xAxis ? (
                            <div className="bg-(--foreground) text-(--background) font-mono text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center gap-2 border border-(--border-color)">
                                <span>{xAxis}</span>
                                <button onClick={() => setXAxis(null)} className="hover:text-rose-400 text-sm leading-none font-bold">×</button>
                            </div>
                        ) : (
                            <span className="text-xs font-mono text-(--brand-secondary) opacity-60">Drop Dimension</span>
                        )}
                    </div>

                    {/* Y-Axis drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropY}
                        className={`paper-sheet p-3 border-2 border-dashed ${yAxis ? 'border-emerald-500 bg-emerald-500/5' : 'border-(--border-color) bg-(--surface)'} flex flex-col items-center justify-center transition-colors min-h-16`}
                    >
                        <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase mb-1.5 tracking-wider">Y-Axis / Metric</span>
                        {yAxis ? (
                            <div className="flex items-center gap-1.5">
                                <select 
                                    className="bg-transparent border border-(--border-color) font-mono text-xs font-semibold px-2 py-1 rounded text-(--foreground) outline-none focus:border-(--brand-primary)"
                                    value={aggregate}
                                    onChange={(e) => setAggregate(e.target.value)}
                                >
                                    <option value="sum">SUM</option>
                                    <option value="avg">AVG</option>
                                    <option value="min">MIN</option>
                                    <option value="max">MAX</option>
                                    <option value="count">COUNT</option>
                                </select>
                                <div className="bg-emerald-600 text-white font-mono text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center gap-2">
                                    <span>{yAxis}</span>
                                    <button onClick={() => setYAxis(null)} className="hover:text-red-200 text-sm leading-none font-bold">×</button>
                                </div>
                            </div>
                        ) : (
                            <span className="text-xs font-mono text-(--brand-secondary) opacity-60">Drop Metric</span>
                        )}
                    </div>

                    {/* Color / Legend drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropColor}
                        className={`paper-sheet p-3 border-2 border-dashed ${colorBy ? 'border-purple-500 bg-purple-500/5' : 'border-(--border-color) bg-(--surface)'} flex flex-col items-center justify-center transition-colors min-h-16`}
                    >
                        <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase mb-1.5 tracking-wider">Color / Legend</span>
                        {colorBy ? (
                            <div className="flex items-center gap-2">
                                <div className="bg-purple-600 text-white font-mono text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center gap-2">
                                    <span>{colorBy}</span>
                                    <button onClick={() => setColorBy(null)} className="hover:text-red-200 text-sm leading-none font-bold">×</button>
                                </div>
                                <button
                                    onClick={() => setStackMode(stackMode === 'stacked' ? 'grouped' : 'stacked')}
                                    className={`font-mono text-xs px-2 py-1 rounded border transition-all ${
                                        stackMode === 'stacked'
                                            ? 'border-purple-500 bg-purple-500/15 text-purple-600 font-bold'
                                            : 'border-(--border-color) text-(--brand-secondary) hover:border-purple-500'
                                    }`}
                                    title={`Mode: ${stackMode}`}
                                >
                                    {stackMode === 'stacked' ? '▤ Stack' : '▥ Group'}
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs font-mono text-(--brand-secondary) opacity-60">Drop Dimension</span>
                        )}
                    </div>

                    {/* Chart Type Selector */}
                    <div className="paper-sheet p-2.5 flex flex-col justify-center">
                        <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase text-center mb-1.5 tracking-wider">Chart Type</span>
                        <div className="grid grid-cols-3 gap-1">
                            {CHART_TYPE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setChartType(opt.value)}
                                    title={opt.label}
                                    className={`
                                        flex flex-col items-center justify-center p-1.5 rounded transition-all text-xs font-mono
                                        ${chartType === opt.value 
                                            ? 'bg-(--brand-primary) text-white shadow-sm scale-105' 
                                            : 'text-(--brand-secondary) hover:bg-(--surface-hover) hover:text-(--foreground)'
                                        }
                                    `}
                                >
                                    <span className="text-base leading-none">{opt.icon}</span>
                                    <span className="text-[10px] mt-1 font-medium leading-none">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {/* AI Suggest Button */}
                        {xAxis && yAxis && (
                            <button
                                onClick={async () => {
                                    setAiSuggestLoading(true);
                                    setAiSuggestReason(null);
                                    try {
                                        const result = await apiFetch(`/analytics/${datasetId}/suggest-chart?x_col=${encodeURIComponent(xAxis)}&y_col=${encodeURIComponent(yAxis)}&agg=${aggregate}`);
                                        setChartType(result.chart_type as ChartType);
                                        setAiSuggestReason(result.reason);
                                    } catch { setAiSuggestReason('Could not get suggestion'); }
                                    setAiSuggestLoading(false);
                                }}
                                disabled={aiSuggestLoading}
                                className="w-full mt-1.5 bg-linear-to-r from-violet-600 to-indigo-600 text-white font-mono text-xs font-semibold px-2.5 py-1.5 rounded hover:opacity-90 transition-opacity uppercase tracking-wider flex items-center justify-center gap-1"
                            >
                                {aiSuggestLoading ? '...' : '✨ AI Suggest'}
                            </button>
                        )}
                        {aiSuggestReason && (
                            <p className="font-mono text-xs text-(--brand-secondary) mt-1 leading-snug">{aiSuggestReason}</p>
                        )}
                    </div>
                </div>

                {/* Secondary Drop Zones: Split By + Tooltip Extras (P5 + P6) */}
                <div className="grid grid-cols-2 gap-3">
                    {/* P5: Split By drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropSplit}
                        className={`paper-sheet p-2.5 border-2 border-dashed ${splitBy ? 'border-orange-500 bg-orange-500/5' : 'border-(--border-color) bg-(--surface)'} flex items-center justify-center gap-2 transition-colors`}
                    >
                        <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase">Split By (Small Multiples)</span>
                        {splitBy ? (
                            <div className="bg-orange-600 text-white font-mono text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center gap-2">
                                <span>{splitBy}</span>
                                <button onClick={() => setSplitBy(null)} className="hover:text-red-200 text-sm leading-none font-bold">×</button>
                            </div>
                        ) : (
                            <span className="text-xs font-mono text-(--brand-secondary) opacity-60">Drop Dimension</span>
                        )}
                    </div>

                    {/* P6: Tooltip Extras drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropTooltipExtra}
                        className={`paper-sheet p-2.5 border-2 border-dashed ${tooltipExtras.length > 0 ? 'border-cyan-500 bg-cyan-500/5' : 'border-(--border-color) bg-(--surface)'} flex items-center justify-center gap-2 transition-colors flex-wrap`}
                    >
                        <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase">Tooltip Extras</span>
                        {tooltipExtras.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {tooltipExtras.map(col => (
                                    <div key={col} className="bg-cyan-600 text-white font-mono text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1.5">
                                        <span>{col}</span>
                                        <button onClick={() => setTooltipExtras(prev => prev.filter(c => c !== col))} className="hover:text-red-200 text-xs leading-none font-bold">×</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs font-mono text-(--brand-secondary) opacity-60">Drop Metrics</span>
                        )}
                    </div>
                </div>

                {/* ── FORMAT PANEL (P4) ──────────────────────────────────────── */}
                {xAxis && yAxis && (
                    <div className="paper-sheet overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setFormatExpanded(!formatExpanded)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-(--surface-hover) transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-widest">
                                    🎨 Format
                                </span>
                                {(showDataLabels || !showXAxis || !showYAxis || !showGridLines || markerSize !== 3) && (
                                    <span className="bg-violet-500/15 text-violet-600 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                                        Custom
                                    </span>
                                )}
                            </div>
                            <span className={`text-(--brand-secondary) text-xs transition-transform ${formatExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {formatExpanded && (
                            <div className="px-4 pb-3 space-y-3">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {/* Data Labels Toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showDataLabels}
                                            onChange={(e) => setShowDataLabels(e.target.checked)}
                                            className="rounded border-(--border-color) accent-(--brand-primary)"
                                        />
                                        <span className="font-mono text-xs text-(--foreground)">Data Labels</span>
                                    </label>
                                    {/* Grid Lines Toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showGridLines}
                                            onChange={(e) => setShowGridLines(e.target.checked)}
                                            className="rounded border-(--border-color) accent-(--brand-primary)"
                                        />
                                        <span className="font-mono text-xs text-(--foreground)">Grid Lines</span>
                                    </label>
                                    {/* X-Axis Toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showXAxis}
                                            onChange={(e) => setShowXAxis(e.target.checked)}
                                            className="rounded border-(--border-color) accent-(--brand-primary)"
                                        />
                                        <span className="font-mono text-xs text-(--foreground)">X-Axis</span>
                                    </label>
                                    {/* Y-Axis Toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showYAxis}
                                            onChange={(e) => setShowYAxis(e.target.checked)}
                                            className="rounded border-(--border-color) accent-(--brand-primary)"
                                        />
                                        <span className="font-mono text-xs text-(--foreground)">Y-Axis</span>
                                    </label>
                                </div>
                                {/* Marker Size Slider */}
                                {(chartType === 'line' || chartType === 'area' || chartType === 'scatter') && (
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase whitespace-nowrap">Marker Size</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={10}
                                            value={markerSize}
                                            onChange={(e) => setMarkerSize(Number(e.target.value))}
                                            className="flex-1 accent-(--brand-primary)"
                                        />
                                        <span className="font-mono text-xs font-semibold text-(--foreground) w-4 text-right">{markerSize}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── DATA SCOPE TOOLBAR ─────────────────────────────────────── */}
                {xAxis && yAxis && (
                    <div className="paper-sheet overflow-hidden transition-all duration-300">
                        {/* Header — always visible */}
                        <button
                            onClick={() => setScopeExpanded(!scopeExpanded)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-(--surface-hover) transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-widest">
                                    ⊞ Data Scope
                                </span>
                                {/* Active filter indicators */}
                                {(granularity || topN || rangeMin || rangeMax || sortOrder || Object.keys(dimensionFilters).length > 0) && (
                                    <div className="flex items-center gap-1.5">
                                        {appliedGranularity && (
                                            <span className="bg-(--brand-primary)/15 text-(--brand-primary) font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                                {appliedGranularity}
                                            </span>
                                        )}
                                        {topN && (
                                            <span className="bg-amber-500/15 text-amber-600 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                                                Top {topN}
                                            </span>
                                        )}
                                        {(rangeMin || rangeMax) && (
                                            <span className="bg-emerald-500/15 text-emerald-600 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                                                Range
                                            </span>
                                        )}
                                        {sortOrder && (
                                            <span className="bg-purple-500/15 text-purple-600 font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                                {sortOrder}
                                            </span>
                                        )}
                                        {Object.keys(dimensionFilters).length > 0 && (
                                            <span className="bg-emerald-500/15 text-emerald-600 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                                                {Object.values(dimensionFilters).flat().length} filters
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
                                            <label className="block font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                                                Granularity
                                            </label>
                                            <div className="flex gap-1.5">
                                                {GRANULARITY_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setGranularity(
                                                            granularity === opt.value ? null : opt.value
                                                        )}
                                                        className={`
                                                            font-mono text-xs px-3 py-1.5 rounded transition-all font-bold uppercase tracking-wider
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
                                        <label className="block font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                                            Sort by Metric
                                        </label>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => setSortOrder(sortOrder === "desc" ? null : "desc")}
                                                className={`
                                                    font-mono text-xs px-3 py-1.5 rounded transition-all font-bold
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
                                                    font-mono text-xs px-3 py-1.5 rounded transition-all font-bold
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
                                            <label className="block font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                                                Date Range
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={rangeMin}
                                                    min={availableRange?.min}
                                                    max={availableRange?.max}
                                                    onChange={(e) => setRangeMin(e.target.value)}
                                                    className="bg-(--surface) border border-(--border-color) font-mono text-xs px-2.5 py-1.5 rounded text-(--foreground) outline-none focus:border-(--brand-primary) w-36"
                                                    placeholder="Start"
                                                />
                                                <span className="font-mono text-xs text-(--brand-secondary) font-bold">→</span>
                                                <input
                                                    type="date"
                                                    value={rangeMax}
                                                    min={availableRange?.min}
                                                    max={availableRange?.max}
                                                    onChange={(e) => setRangeMax(e.target.value)}
                                                    className="bg-(--surface) border border-(--border-color) font-mono text-xs px-2.5 py-1.5 rounded text-(--foreground) outline-none focus:border-(--brand-primary) w-36"
                                                    placeholder="End"
                                                />
                                                {(rangeMin || rangeMax) && (
                                                    <button
                                                        onClick={() => { setRangeMin(""); setRangeMax(""); }}
                                                        className="text-rose-500 hover:text-rose-400 font-mono text-xs font-bold px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                                                        title="Clear range"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            {availableRange && (
                                                <p className="font-mono text-xs text-(--brand-secondary) mt-1 opacity-75">
                                                    Available: {availableRange.min} → {availableRange.max}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Top N Control */}
                                    <div className="min-w-40">
                                        <label className="block font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                                            Limit Results
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs text-(--brand-secondary) font-bold">Top</span>
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
                                                className="bg-(--surface) border border-(--border-color) font-mono text-xs px-2.5 py-1.5 rounded text-(--foreground) outline-none focus:border-(--brand-primary) w-18 text-center"
                                            />
                                            <span className="font-mono text-xs text-(--brand-secondary)">results</span>
                                            {topN && (
                                                <button
                                                    onClick={() => setTopN(null)}
                                                    className="text-rose-500 hover:text-rose-400 font-mono text-xs font-bold px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                                                    title="Show all"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Presets */}
                                    <div className="min-w-25">
                                        <label className="block font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                                            Quick Set
                                        </label>
                                        <div className="flex gap-1.5">
                                            {[5, 10, 25].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setTopN(topN === n ? null : n)}
                                                    className={`
                                                        font-mono text-xs px-2.5 py-1.5 rounded transition-all font-bold
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
                                {/* Row 3: Dimension Filters (multi-select checkboxes) */}
                                {Object.keys(dimensionValues).length > 0 && (
                                    <div className="pt-2.5 border-t border-(--border-color)">
                                        <label className="block font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-wider mb-2">
                                            Filter by Dimension
                                        </label>
                                        <div className="space-y-3">
                                            {Object.entries(dimensionValues).map(([dimCol, values]) => {
                                                const selected = dimensionFilters[dimCol] || [];
                                                const hasFilter = selected.length > 0;
                                                return (
                                                    <div key={dimCol}>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="font-mono text-xs font-bold text-(--foreground)">{dimCol}</span>
                                                            {hasFilter && (
                                                                <span className="font-mono text-xs text-emerald-600 font-bold">
                                                                    {selected.length}/{values.length} selected
                                                                </span>
                                                            )}
                                                            {hasFilter && (
                                                                <button
                                                                    onClick={() => {
                                                                        const next = { ...dimensionFilters };
                                                                        delete next[dimCol];
                                                                        setDimensionFilters(next);
                                                                    }}
                                                                    className="font-mono text-xs text-rose-500 hover:text-rose-400 font-bold hover:underline"
                                                                >
                                                                    Clear
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {values.map(val => {
                                                                const isSelected = selected.includes(val);
                                                                return (
                                                                    <button
                                                                        key={val}
                                                                        onClick={() => {
                                                                            const current = dimensionFilters[dimCol] || [];
                                                                            let next: string[];
                                                                            if (isSelected) {
                                                                                next = current.filter(v => v !== val);
                                                                            } else {
                                                                                next = [...current, val];
                                                                            }
                                                                            if (next.length === 0) {
                                                                                const copy = { ...dimensionFilters };
                                                                                delete copy[dimCol];
                                                                                setDimensionFilters(copy);
                                                                            } else {
                                                                                setDimensionFilters({ ...dimensionFilters, [dimCol]: next });
                                                                            }
                                                                        }}
                                                                        className={`
                                                                            font-mono text-xs px-2.5 py-1 rounded transition-all
                                                                            ${isSelected
                                                                                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                                                                                : 'bg-(--surface) border border-(--border-color) text-(--brand-secondary) hover:border-emerald-500 hover:text-(--foreground)'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {val}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Active filters summary */}
                                {totalRowsBeforeLimit > 0 && displayedRows < totalRowsBeforeLimit && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-(--border-color)">
                                        <span className="font-mono text-xs text-amber-600 font-bold uppercase">
                                            ⚡ Showing {displayedRows} of {totalRowsBeforeLimit} groups
                                        </span>
                                        <button
                                            onClick={() => {
                                                setGranularity(null);
                                                setTopN(null);
                                                setRangeMin("");
                                                setRangeMax("");
                                                setSortOrder(null);
                                                setDimensionFilters({});
                                            }}
                                            className="font-mono text-xs text-rose-500 hover:text-rose-400 font-bold uppercase hover:underline"
                                        >
                                            Reset All Filters
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
                        <div className="flex items-center gap-2">
                            {queryData && (
                                <>
                                    <span className="font-mono text-xs text-(--brand-secondary)">
                                        {displayedRows}{totalRowsBeforeLimit > displayedRows ? ` / ${totalRowsBeforeLimit}` : ''} rows
                                    </span>
                                    {appliedGranularity && (
                                        <span className="font-mono text-xs bg-(--brand-primary)/10 text-(--brand-primary) px-2 py-0.5 rounded font-bold uppercase">
                                            by {appliedGranularity}
                                        </span>
                                    )}
                                </>
                            )}
                            {(xAxis || yAxis) && (
                                <button
                                    onClick={handleResetCanvas}
                                    className="font-mono text-xs text-(--brand-secondary) hover:text-rose-500 border border-(--border-color) hover:border-rose-300 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1"
                                    title="Reset visual canvas and start fresh"
                                >
                                    ↺ Reset
                                </button>
                            )}
                            {queryData && (
                                <button onClick={handlePin} className="bg-(--brand-primary) text-white font-mono text-xs font-semibold px-3.5 py-1.5 rounded hover:opacity-90 transition-opacity uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                    📌 Pin to Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 relative z-10 bg-(--surface)/80 backdrop-blur-sm border border-(--border-color) rounded p-3 flex items-center justify-center min-h-87.5">
                        {!xAxis || !yAxis ? (
                            <div className="text-center">
                                <IsometricCube className="w-20 h-20 mx-auto text-(--border-color) mb-3" />
                                <p className="font-mono text-(--brand-secondary) text-sm font-medium">Drag columns to X and Y axes to generate visual</p>
                                <p className="font-mono text-(--brand-secondary) text-xs mt-1 opacity-70">Select a chart type from the picker above</p>
                            </div>
                        ) : queryData ? (
                            splitBy ? (
                                <SmallMultiples
                                    data={queryData.result.data}
                                    splitBy={splitBy}
                                    labelKey={xAxis}
                                    valueKey="agg_value"
                                    chartType={chartType}
                                    title={`${aggregate.toUpperCase()}(${yAxis}) by ${xAxis} — split by ${splitBy}`}
                                />
                            ) : (
                                <Visualizer 
                                    data={queryData.result.data}
                                    type={chartType}
                                    labelKey={xAxis}
                                    valueKey="agg_value"
                                    title={`${aggregate.toUpperCase()}(${yAxis}) by ${xAxis}${colorBy ? ` × ${colorBy}` : ''}${appliedGranularity ? ` [${appliedGranularity}]` : ''}`}
                                    onDrillDown={(label) => {
                                        setDrillPath(prev => [...prev, { column: xAxis, value: label }]);
                                    }}
                                    seriesData={queryData.series_data || undefined}
                                    stackMode={stackMode}
                                    colorByColumn={colorBy || undefined}
                                    showDataLabels={showDataLabels}
                                    showXAxis={showXAxis}
                                    showYAxis={showYAxis}
                                    showGridLines={showGridLines}
                                    markerSize={markerSize}
                                    tooltipExtras={tooltipExtras.length > 0 ? tooltipExtras.map(col => ({ key: col, label: col })) : undefined}
                                />
                            )
                        ) : (
                            <p className="font-mono text-(--brand-secondary) animate-pulse text-sm">Compiling query...</p>
                        )}
                    </div>
                    
                    {queryData && (
                        <div className="mt-3 relative z-10 space-y-2">
                            {/* Drill-down breadcrumbs */}
                            {drillPath.length > 0 && (
                                <div className="flex items-center gap-1.5 font-mono text-xs">
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
                                        className="ml-2 bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-xs hover:bg-rose-500/20 transition-colors uppercase font-bold"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}
                            <div className="bg-(--brand-primary)/10 border border-(--brand-primary)/30 p-2.5 rounded font-mono text-xs text-(--foreground) flex items-center gap-2">
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
