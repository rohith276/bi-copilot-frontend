"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "./Toast";
import Visualizer from "./Visualizer";

interface AnalyticsExplorerProps {
    datasetId: number;
    activeModule?: string;
}



type AnalyticsTab = "forecast" | "predict" | "recommend" | "detect";


export default function AnalyticsExplorer({ datasetId, activeModule }: AnalyticsExplorerProps) {

    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<AnalyticsTab>("forecast");
    const [columns, setColumns] = useState<string[]>([]);
    const [numericCols, setNumericCols] = useState<string[]>([]);
    const [categoryCols, setCategoryCols] = useState<string[]>([]);
    const [loadingCols, setLoadingCols] = useState(true);

    // Forecast state
    const [fDateCol, setFDateCol] = useState("");
    const [fValueCol, setFValueCol] = useState("");
    const [fPeriods, setFPeriods] = useState(30);
    const [fLoading, setFLoading] = useState(false);
    const [fResult, setFResult] = useState<any>(null);

    // Predict state
    const [pTargetCol, setPTargetCol] = useState("");
    const [pFeatureCols, setPFeatureCols] = useState<string[]>([]);
    const [pLoading, setPLoading] = useState(false);
    const [pResult, setPResult] = useState<any>(null);

    // Recommendations state
    const [rProductCol, setRProductCol] = useState("");
    const [rSalesCol, setRSalesCol] = useState("");
    const [rInventoryCol, setRInventoryCol] = useState("");
    const [rLoading, setRLoading] = useState(false);
    const [rResult, setRResult] = useState<any[]>([]);
    
    // Anomaly state
    const [aColumn, setAColumn] = useState("");
    const [aLoading, setALoading] = useState(false);
    const [aResult, setAResult] = useState<any[]>([]);


    useEffect(() => {
        if (typeof activeModule === 'string') {
            if (activeModule.includes("Intelligence")) setActiveTab("forecast");
            if (activeModule.includes("Sales")) setActiveTab("forecast");
            if (activeModule.includes("Actions")) setActiveTab("recommend");
        }
    }, [activeModule]);


    useEffect(() => {
        const fetchColumnInfo = async () => {

            try {
                const stats = await apiFetch(`/datasets/${datasetId}/stats`);
                const allCols: string[] = stats.map((s: any) => s.name);
                const numeric = stats
                    .filter((s: any) => s.type.includes("int") || s.type.includes("float"))
                    .map((s: any) => s.name);
                const category = stats
                    .filter((s: any) => s.type === "object" || s.type === "string")
                    .map((s: any) => s.name);
                const dateCols = stats
                    .filter((s: any) => s.type.includes("datetime") || s.name.toLowerCase().includes("date"))
                    .map((s: any) => s.name);

                setColumns(allCols);
                setNumericCols(numeric);
                setCategoryCols(category);

                // Auto-select sensible defaults
                if (dateCols.length > 0) setFDateCol(dateCols[0]);
                else if (allCols.length > 0) setFDateCol(allCols[0]);
                if (numeric.length > 0) {
                    setFValueCol(numeric[0]);
                    setPTargetCol(numeric[0]);
                    setRSalesCol(numeric[0]);
                }
                if (numeric.length > 1) setRInventoryCol(numeric[1]);
                if (category.length > 0) {
                    setRProductCol(category[0]);
                }
            } catch (e) {
                addToast("Failed to load column info", "error");
            } finally {
                setLoadingCols(false);
            }
        };
        fetchColumnInfo();
    }, [datasetId]);

    // ---- Forecast ----
    const runForecast = async () => {
        if (!fDateCol || !fValueCol) return;
        setFLoading(true);
        setFResult(null);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/forecast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date_col: fDateCol, value_col: fValueCol, periods: fPeriods }),
            });
            setFResult(result);
            addToast("Forecast computed successfully!", "success");
        } catch (e: any) {
            addToast(e.message || "Forecast failed", "error");
        } finally {
            setFLoading(false);
        }
    };

    // ---- Trend Prediction ----
    const toggleFeatureCol = (col: string) => {
        setPFeatureCols((prev) =>
            prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
        );
    };

    const runPredict = async () => {
        if (!pTargetCol || pFeatureCols.length === 0) {
            addToast("Select a target and at least one feature column", "error");
            return;
        }
        setPLoading(true);
        setPResult(null);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_col: pTargetCol, feature_cols: pFeatureCols }),
            });
            setPResult(result);
            addToast("Trend prediction complete!", "success");
        } catch (e: any) {
            addToast(e.message || "Prediction failed", "error");
        } finally {
            setPLoading(false);
        }
    };

    // ---- Recommendations ----
    const runRecommendations = async () => {
        if (!rProductCol || !rSalesCol || !rInventoryCol) {
            addToast("Please select all three columns", "error");
            return;
        }
        setRLoading(true);
        setRResult([]);
        try {
            const result = await apiFetch(
                `/analytics/${datasetId}/recommendations?product_col=${encodeURIComponent(rProductCol)}&sales_col=${encodeURIComponent(rSalesCol)}&inventory_col=${encodeURIComponent(rInventoryCol)}`
            );
            setRResult(result);
            addToast(`${result.length} recommendations generated!`, "success");
        } catch (e: any) {
            addToast(e.message || "Recommendations failed", "error");
        } finally {
            setRLoading(false);
        }
    };

    // ---- Anomaly Detection ----
    const runAnomalyDetection = async () => {
        if (!aColumn) {
            addToast("Please select a numeric column", "error");
            return;
        }
        setALoading(true);
        setAResult([]);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/anomalies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ column: aColumn }),
            });
            setAResult(result);
            addToast(result.length > 0 ? `${result.length} anomalies detected!` : "No significant anomalies found.", "success");
        } catch (e: any) {
            addToast(e.message || "Anomaly detection failed", "error");
        } finally {
            setALoading(false);
        }
    };


    // Build forecast chart data
    const forecastChartData = fResult
        ? fResult.dates.map((d: string, i: number) => ({ date: d, value: fResult.values[i] }))
        : [];

    const tabs: { key: AnalyticsTab; label: string; icon: string }[] = [
        { key: "forecast", label: "Sales Forecast", icon: "📈" },
        { key: "predict", label: "Trend Prediction", icon: "🔮" },
        { key: "recommend", label: "Recommendations", icon: "💡" },
        { key: "detect", label: "Anomalies", icon: "🚨" },
    ];


    const priorityColors: Record<string, string> = {
        High: "bg-red-100 text-red-700 border-red-200",
        Medium: "bg-amber-100 text-amber-700 border-amber-200",
        Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    return (
        <div className="w-full min-h-[85vh] flex flex-col animate-in fade-in duration-500">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[40px] shadow-2xl w-full flex-1 flex flex-col border border-white/50 dark:border-white/5 overflow-hidden">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center gap-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl shadow-xl border border-white/20">
                        🤖
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">AI Analytics Engine</h2>
                        <p className="text-xs text-white/70 font-black uppercase tracking-widest">
                            Dataset #{datasetId} — Forecasting · Prediction · Recommendations
                        </p>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex px-8 bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border-b-4 flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-10 bg-white/30 dark:bg-slate-900/30">
                    {loadingCols ? (
                        <div className="flex items-center justify-center h-64 gap-4">
                            <div className="w-10 h-10 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Analysing columns...</p>
                        </div>
                    ) : activeTab === "forecast" ? (
                        <div className="flex flex-col lg:flex-row gap-10">

                            {/* Controls */}
                            <div className="lg:w-80 space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-xl border border-slate-100 dark:border-white/5">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-violet-600 text-white rounded-lg flex items-center justify-center text-[8px]">⚙</span>
                                        Forecast Config
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date Column</label>
                                            <select
                                                value={fDateCol}
                                                onChange={(e) => setFDateCol(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                            >
                                                <option value="">Select column...</option>
                                                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Value Column (Numeric)</label>
                                            <select
                                                value={fValueCol}
                                                onChange={(e) => setFValueCol(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                            >
                                                <option value="">Select column...</option>
                                                {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Forecast Periods (Days)</label>
                                            <input
                                                type="number"
                                                value={fPeriods}
                                                min={7}
                                                max={365}
                                                onChange={(e) => setFPeriods(parseInt(e.target.value))}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                            />
                                        </div>
                                        <button
                                            onClick={runForecast}
                                            disabled={fLoading || !fDateCol || !fValueCol}
                                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-violet-200 dark:shadow-violet-900/30 flex items-center justify-center gap-2"
                                        >
                                            {fLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Forecasting...</>
                                            ) : (
                                                <><span>📈</span> Run Forecast</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {fResult && (
                                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-2xl">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-3">Forecast Summary</p>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-3xl">{fResult.trend === "up" ? "📈" : "📉"}</span>
                                            <div>
                                                <p className="font-black text-lg capitalize">{fResult.trend === "up" ? "Upward" : "Downward"} Trend</p>
                                                <p className="text-xs opacity-70">{fPeriods}-day projection</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="bg-white/10 rounded-xl p-3">
                                                <p className="opacity-70 text-[9px] uppercase font-black mb-1">Start Value</p>
                                                <p className="font-black text-lg">{fResult.values[0]?.toFixed(0)}</p>
                                            </div>
                                            <div className="bg-white/10 rounded-xl p-3">
                                                <p className="opacity-70 text-[9px] uppercase font-black mb-1">End Value</p>
                                                <p className="font-black text-lg">{fResult.values[fResult.values.length - 1]?.toFixed(0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chart */}
                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/5 p-10 min-h-[500px] flex flex-col justify-center">
                                {fResult ? (
                                    <>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
                                            {fPeriods}-Day Forecast: <span className="text-violet-600">{fValueCol}</span>
                                        </h3>
                                        <Visualizer
                                            type="line"
                                            data={forecastChartData}
                                            labelKey="date"
                                            valueKey="value"
                                            title={`${fPeriods}-Day Forecast`}
                                        />
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                                        <div className="text-6xl">📈</div>
                                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Configure and run forecast</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === "predict" ? (
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* ── TREND PREDICTION TAB ── */}

                            {/* Controls */}
                            <div className="lg:w-80 space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-xl border border-slate-100 dark:border-white/5">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[8px]">⚙</span>
                                        Regression Config
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Target Column (Y)</label>
                                            <select
                                                value={pTargetCol}
                                                onChange={(e) => setPTargetCol(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            >
                                                <option value="">Select target...</option>
                                                {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Feature Columns (X) — Select Multiple</label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                {numericCols.filter((c) => c !== pTargetCol).map((col) => (
                                                    <button
                                                        key={col}
                                                        onClick={() => toggleFeatureCol(col)}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                                            pFeatureCols.includes(col)
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-300"
                                                        }`}
                                                    >
                                                        {pFeatureCols.includes(col) ? "✓ " : ""}{col}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={runPredict}
                                            disabled={pLoading || !pTargetCol || pFeatureCols.length === 0}
                                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl flex items-center justify-center gap-2"
                                        >
                                            {pLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Predicting...</>
                                            ) : (
                                                <><span>🔮</span> Run Prediction</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="flex-1 space-y-6">
                                {pResult ? (
                                    <>
                                        {/* R² Score */}
                                        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-xl border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Model Performance</h3>
                                                <div className={`px-4 py-2 rounded-xl text-sm font-black ${
                                                    pResult.r2_score > 0.8 ? "bg-emerald-100 text-emerald-700" :
                                                    pResult.r2_score > 0.5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                    R² = {pResult.r2_score.toFixed(4)}
                                                </div>
                                            </div>
                                            {/* R² bar */}
                                            <div className="mb-2">
                                                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1">
                                                    <span>Model Accuracy</span>
                                                    <span>{(pResult.r2_score * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${
                                                            pResult.r2_score > 0.8 ? "bg-emerald-500" :
                                                            pResult.r2_score > 0.5 ? "bg-amber-500" : "bg-red-500"
                                                        }`}
                                                        style={{ width: `${Math.max(0, Math.min(100, pResult.r2_score * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {pResult.r2_score > 0.8
                                                    ? "Excellent fit: features strongly explain the target variable."
                                                    : pResult.r2_score > 0.5
                                                    ? "Moderate fit: some predictive power, consider adding more features."
                                                    : "Weak fit: features have limited explanatory power for this target."}
                                            </p>
                                        </div>

                                        {/* Coefficients */}
                                        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-xl border border-slate-100 dark:border-white/5">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Feature Coefficients</h3>
                                            <div className="space-y-4">
                                                {Object.entries(pResult.coefficients).map(([feat, coeff]: [string, any]) => {
                                                    const maxCoeff = Math.max(...Object.values(pResult.coefficients).map((v: any) => Math.abs(v)));
                                                    const pct = maxCoeff === 0 ? 0 : Math.abs(coeff) / maxCoeff * 100;
                                                    return (
                                                        <div key={feat}>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{feat}</span>
                                                                <span className={`text-xs font-black ${coeff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                                    {coeff > 0 ? "+" : ""}{coeff.toFixed(4)}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${coeff > 0 ? "bg-emerald-500" : "bg-red-400"}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Intercept</span>
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{pResult.intercept.toFixed(4)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/5 p-10 flex flex-col items-center justify-center gap-4 min-h-[400px] opacity-30">
                                        <div className="text-6xl">🔮</div>
                                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Select columns and run prediction</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === "recommend" ? (
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* ── RECOMMENDATIONS TAB ── */}

                            {/* Controls */}
                            <div className="lg:w-80 space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-xl border border-slate-100 dark:border-white/5">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[8px]">⚙</span>
                                        Recommendation Config
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Product / Item Column</label>
                                            <select
                                                value={rProductCol}
                                                onChange={(e) => setRProductCol(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                            >
                                                <option value="">Select column...</option>
                                                {[...categoryCols, ...numericCols].map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sales Column (Numeric)</label>
                                            <select
                                                value={rSalesCol}
                                                onChange={(e) => setRSalesCol(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                            >
                                                <option value="">Select column...</option>
                                                {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Inventory / Quantity Column</label>
                                            <select
                                                value={rInventoryCol}
                                                onChange={(e) => setRInventoryCol(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                            >
                                                <option value="">Select column...</option>
                                                {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            onClick={runRecommendations}
                                            disabled={rLoading || !rProductCol || !rSalesCol || !rInventoryCol}
                                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-amber-200 dark:shadow-amber-900/30 flex items-center justify-center gap-2"
                                        >
                                            {rLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                                            ) : (
                                                <><span>💡</span> Generate</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="flex-1">
                                {rResult.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {rResult.length} Recommendations Generated
                                            </h3>
                                            <div className="flex gap-2 text-[9px] font-black">
                                                {["High", "Medium", "Low"].map((p) => (
                                                    <span key={p} className={`px-2 py-1 rounded-lg border ${priorityColors[p]}`}>
                                                        {rResult.filter((r) => r.priority === p).length} {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid gap-4">
                                            {rResult.map((rec, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-lg border border-slate-100 dark:border-white/5 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                                    style={{ animationDelay: `${i * 50}ms` }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                                                                {rec.priority === "High" ? "🚨" : rec.priority === "Medium" ? "⚡" : "✅"}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 dark:text-white text-sm mb-1">{rec.action}</p>
                                                                <p className="text-slate-500 text-xs font-medium leading-relaxed">{rec.reason}</p>
                                                                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">
                                                                    📦 {rec.product}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border flex-shrink-0 ${priorityColors[rec.priority] || "bg-slate-100 text-slate-600"}`}>
                                                            {rec.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/5 p-10 flex flex-col items-center justify-center gap-4 min-h-[400px] opacity-30">
                                        <div className="text-6xl">💡</div>
                                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Configure columns to get recommendations</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* ── ANOMALY DETECTION TAB ── */}

                             {/* Controls */}
                             <div className="lg:w-80 space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-xl border border-slate-100 dark:border-white/5">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-pink-600 text-white rounded-lg flex items-center justify-center text-[8px]">⚙</span>
                                        Anomaly Config
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Detection Column</label>
                                            <select
                                                value={aColumn}
                                                onChange={(e) => setAColumn(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                                            >
                                                <option value="">Select column...</option>
                                                {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            onClick={runAnomalyDetection}
                                            disabled={aLoading || !aColumn}
                                            className="w-full py-3.5 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-pink-200 dark:shadow-pink-900/30 flex items-center justify-center gap-2"
                                        >
                                            {aLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</>
                                            ) : (
                                                <><span>🚨</span> Detect Anomalies</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                {aResult.length > 0 && (
                                    <div className="bg-slate-900 rounded-[32px] p-6 text-white border border-white/5">
                                        <p className="text-[10px] font-black uppercase text-pink-500 mb-3 tracking-widest">Statistical Insight</p>
                                        <p className="text-xs leading-relaxed opacity-80">
                                            Found {aResult.length} data points deviating more than 3σ from the mean in "{aColumn}".
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Results */}
                            <div className="flex-1 overflow-auto max-h-[600px] pr-2 custom-scrollbar">

                                {aResult.length > 0 ? (
                                    <div className="grid gap-4">
                                        {aResult.map((ano, i) => (
                                            <div
                                                key={i}
                                                className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-lg border border-slate-100 dark:border-white/5 hover:border-pink-300 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
                                                style={{ animationDelay: `${i * 50}ms` }}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${ano.deviation === "High" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}>
                                                            {ano.deviation === "High" ? "▲" : "▼"}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 dark:text-white text-sm">Value: {ano.value}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Row Index: {ano.row_index}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Z-Score</p>
                                                        <p className={`font-black text-sm ${Math.abs(ano.z_score) > 5 ? "text-red-600" : "text-pink-500"}`}>
                                                            {ano.z_score.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-2">
                                                    {Object.entries(ano.other_data as Record<string, string>).map(([k, v]) => (
                                                        <div key={k} className="flex gap-2 text-[10px]">
                                                            <span className="font-black text-slate-400 uppercase">{k}:</span>
                                                            <span className="font-bold text-slate-600 dark:text-slate-300">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/5 p-10 flex flex-col items-center justify-center gap-4 min-h-[400px] opacity-30">
                                        <div className="text-6xl">🚨</div>
                                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Select column and run detection</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
