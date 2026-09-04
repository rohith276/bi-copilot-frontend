"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "./Toast";
import Visualizer from "./Visualizer";
import WhatIfPanel from "./WhatIfPanel";
import { PaperTape, TechnicalBadge } from "./PaperAccents";

interface AnalyticsExplorerProps {
    datasetId: number;
    activeModule?: string;
}

type AnalyticsTab = "forecast" | "predict" | "recommend" | "detect" | "rootcause";

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
    const [scenarioMultiplier, setScenarioMultiplier] = useState(1.0);

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
    const [aResult, setAResult] = useState<any>(null);

    // Root-cause state
    const [rcMetricCol, setRcMetricCol] = useState("");
    const [rcQuestion, setRcQuestion] = useState("Why did this metric change?");
    const [rcLoading, setRcLoading] = useState(false);
    const [rcResult, setRcResult] = useState<any>(null);

    useEffect(() => {
        if (typeof activeModule === 'string') {
            if (activeModule.includes("Intelligence") || activeModule.includes("Sales")) setActiveTab("forecast");
            if (activeModule.includes("Actions") || activeModule.includes("Inventory")) setActiveTab("recommend");
            if (activeModule.includes("Anomaly")) setActiveTab("detect");
            if (activeModule.includes("Root")) setActiveTab("rootcause");
        }
    }, [activeModule]);

    useEffect(() => {
        const fetchColumnInfo = async () => {
            try {
                const stats = await apiFetch(`/datasets/${datasetId}/stats`);
                const allCols: string[] = stats.map((s: { name: string }) => s.name);
                const numeric: string[] = stats
                    .filter((s: { type?: string }) => s.type?.includes("int") || s.type?.includes("float"))
                    .map((s: { name: string }) => s.name);
                const category: string[] = stats
                    .filter((s: { type?: string; bi_type?: string }) => s.type === "object" || s.type === "string" || s.type === "str" || s.bi_type === "dimension")
                    .map((s: { name: string }) => s.name);
                const dateCols: string[] = stats
                    .filter((s: { type?: string; bi_type?: string; name: string }) => s.type?.includes("datetime") || s.bi_type === "datetime" || s.name.toLowerCase().includes("date"))
                    .map((s: { name: string }) => s.name);

                setColumns(allCols);
                setNumericCols(numeric);
                setCategoryCols(category);

                // Smart selection for domain-specific metrics
                const salesLike = numeric.find((n: string) => /sales|revenue|total|amount/i.test(n)) || numeric[0];
                const invLike = numeric.find((n: string) => /qty|quantity|inventory|stock/i.test(n)) || (numeric.length > 1 ? numeric[1] : numeric[0]);
                const prodLike = category.find((c: string) => /product.*name/i.test(c)) || 
                                 category.find((c: string) => /product/i.test(c)) || 
                                 category.find((c: string) => /sku|item|description/i.test(c)) || 
                                 category[0];

                if (dateCols.length > 0) {
                    const orderDateLike = dateCols.find((d: string) => /order|trans|event/i.test(d)) || dateCols[0];
                    setFDateCol(orderDateLike);
                } else if (allCols.length > 0) {
                    setFDateCol(allCols[0]);
                }
                
                if (salesLike) {
                    setFValueCol(salesLike);
                    setPTargetCol(salesLike);
                    setRSalesCol(salesLike);
                    setAColumn(salesLike);
                    setRcMetricCol(salesLike);
                }
                if (invLike) setRInventoryCol(invLike);
                if (prodLike) setRProductCol(prodLike);

                // Sensible regression features
                const potentialFeatures = numeric.filter((c: string) => c !== salesLike && !/id|code|row|zip|postal/i.test(c));
                if (potentialFeatures.length > 0) {
                    setPFeatureCols(potentialFeatures.slice(0, 4));
                } else if (numeric.length > 1) {
                    setPFeatureCols(numeric.filter((c: string) => c !== salesLike).slice(0, 3));
                }
            } catch (e) {
                addToast("Failed to load column metadata", "error");
            } finally {
                setLoadingCols(false);
            }
        };
        void fetchColumnInfo();
    }, [datasetId, addToast]);

    // ---- Forecast ----
    const runForecast = async () => {
        if (!fDateCol || !fValueCol) return;
        setFLoading(true);
        setFResult(null);
        setScenarioMultiplier(1.0);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/forecast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date_col: fDateCol, value_col: fValueCol, periods: fPeriods }),
            });
            setFResult(result);
            addToast(`Forecast complete: ${result.frequency || 'Adaptive'} frequency selected`, "success");
        } catch (e: any) {
            addToast(e.message || "Forecast failed", "error");
        } finally {
            setFLoading(false);
        }
    };

    // ---- Regression ----
    const runPrediction = async () => {
        if (!pTargetCol || pFeatureCols.length === 0) return;
        setPLoading(true);
        setPResult(null);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_col: pTargetCol, feature_cols: pFeatureCols }),
            });
            setPResult(result);
            addToast(`Regression fitted: ${result.model_engine}`, "success");
        } catch (e: any) {
            addToast(e.message || "Regression analysis failed", "error");
        } finally {
            setPLoading(false);
        }
    };

    const toggleFeature = (col: string) => {
        setPFeatureCols(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    // ---- Recommendations ----
    const runRecommendations = async () => {
        if (!rProductCol || !rSalesCol || !rInventoryCol) return;
        setRLoading(true);
        setRResult([]);
        try {
            const result = await apiFetch(
                `/analytics/${datasetId}/recommendations?product_col=${encodeURIComponent(rProductCol)}&sales_col=${encodeURIComponent(rSalesCol)}&inventory_col=${encodeURIComponent(rInventoryCol)}`
            );
            setRResult(result);
            addToast(`Generated ${result.length} inventory action specifications`, "success");
        } catch (e: any) {
            addToast(e.message || "Recommendations failed", "error");
        } finally {
            setRLoading(false);
        }
    };

    // ---- Anomalies ----
    const runAnomalyDetection = async () => {
        if (!aColumn) return;
        setALoading(true);
        setAResult(null);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/anomalies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ column: aColumn }),
            });
            setAResult(result);
            addToast(`Identified ${result.anomalies?.length || 0} high-severity outliers`, "success");
        } catch (e: any) {
            addToast(e.message || "Anomaly detection failed", "error");
        } finally {
            setALoading(false);
        }
    };

    // ---- Root-Cause ----
    const runRootCause = async () => {
        setRcLoading(true);
        setRcResult(null);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/root-cause`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    metric_col: rcMetricCol || undefined,
                    question: rcQuestion || undefined,
                }),
            });
            setRcResult(result);
            addToast("Root-cause decomposition complete", "success");
        } catch (e: any) {
            addToast(e.message || "Root-cause analysis failed", "error");
        } finally {
            setRcLoading(false);
        }
    };

    const forecastChartData = useMemo(() => {
        if (!fResult) return [];
        return fResult.dates.map((d: string, i: number) => ({
            date: d,
            value: fResult.values[i],
            scenario: fResult.values[i] * scenarioMultiplier,
            lower: fResult.lower_bounds ? fResult.lower_bounds[i] * scenarioMultiplier : undefined,
            upper: fResult.upper_bounds ? fResult.upper_bounds[i] * scenarioMultiplier : undefined,
        }));
    }, [fResult, scenarioMultiplier]);

    const forecastBaseValue = useMemo(() => {
        if (!fResult?.values?.length) return 0;
        return fResult.values[fResult.values.length - 1];
    }, [fResult]);

    const tabs: { key: AnalyticsTab; label: string }[] = [
        { key: "forecast", label: "TIME SERIES FORECAST" },
        { key: "predict", label: "REGRESSION ANALYSIS" },
        { key: "recommend", label: "INVENTORY ACTION SPECS" },
        { key: "detect", label: "ANOMALY DETECTION" },
        { key: "rootcause", label: "ROOT-CAUSE ANALYSIS" },
    ];

    return (
        <div className="paper-sheet flex flex-col h-full min-h-150 relative overflow-hidden font-mono text-xs">
            <PaperTape className="right-4 top-2 rotate-2" />

            {/* Technical Header */}
            <div className="bg-surface-200 border-b border-border-color p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                        <span>ADVANCED ANALYTICAL ENGINE</span>
                        <TechnicalBadge text={`SPEC #${datasetId}`} status="blueprint" />
                    </h2>
                    <p className="text-[11px] text-brand-secondary">Execute tournament forecasting, multi-factor regression, ABC Pareto operations & additive root-cause</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-border-color bg-surface-200 px-4 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-3 text-xs font-mono font-bold tracking-wider transition-colors border-b-2 uppercase whitespace-nowrap ${
                            activeTab === tab.key
                                ? "border-brand-primary text-brand-primary"
                                : "border-transparent text-brand-secondary hover:text-foreground"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-surface-100">
                {loadingCols ? (
                    <div className="flex items-center justify-center w-full h-full text-brand-secondary font-mono text-xs py-12">
                        Loading column metadata...
                    </div>
                ) : (
                    <>
                        {/* LEFT CONTROLS PANEL */}
                        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border-color bg-surface-200 p-5 overflow-y-auto shrink-0 font-mono text-xs">
                            
                            {activeTab === "forecast" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-foreground border-b border-border-color pb-2 uppercase">Forecast Configuration</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Date Column</label>
                                        <select
                                            value={fDateCol}
                                            onChange={(e) => setFDateCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select date column</option>
                                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Target Metric</label>
                                        <select
                                            value={fValueCol}
                                            onChange={(e) => setFValueCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select metric</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Horizon Periods</label>
                                        <input
                                            type="number"
                                            value={fPeriods}
                                            min={3}
                                            max={180}
                                            onChange={(e) => setFPeriods(parseInt(e.target.value) || 14)}
                                            className="saas-input w-full font-mono text-xs"
                                        />
                                    </div>
                                    <button
                                        onClick={runForecast}
                                        disabled={fLoading || !fDateCol || !fValueCol}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {fLoading ? "Running Tournament..." : "Run Tournament Forecast →"}
                                    </button>
                                </div>
                            )}

                            {activeTab === "predict" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-foreground border-b border-border-color pb-2 uppercase">Regression Config</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Target Variable (Y)</label>
                                        <select
                                            value={pTargetCol}
                                            onChange={(e) => setPTargetCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select target</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-2">Predictive Features (X)</label>
                                        <div className="space-y-1 max-h-48 overflow-y-auto border border-border-color rounded p-2 bg-surface-100">
                                            {[
                                                ...numericCols.filter(c => c !== pTargetCol),
                                                ...columns.filter(c => !numericCols.includes(c) && c !== pTargetCol)
                                            ].map(col => (
                                                <label key={col} className="flex items-center gap-2 text-xs p-1 hover:bg-surface-200 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={pFeatureCols.includes(col)}
                                                        onChange={() => toggleFeature(col)}
                                                        className="rounded text-brand-primary"
                                                    />
                                                    <span className="truncate font-mono">{col}</span>
                                                    {numericCols.includes(col) && (
                                                        <span className="text-[9px] text-brand-primary border border-brand-primary/30 px-1 rounded ml-auto">NUM</span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={runPrediction}
                                        disabled={pLoading || !pTargetCol || pFeatureCols.length === 0}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {pLoading ? "Evaluating Models..." : "Run AutoML Regression →"}
                                    </button>
                                </div>
                            )}

                            {activeTab === "recommend" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-foreground border-b border-border-color pb-2 uppercase">Inventory & Operations Config</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Product / SKU Column</label>
                                        <select
                                            value={rProductCol}
                                            onChange={(e) => setRProductCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select product column</option>
                                            {categoryCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Sales / Revenue Metric</label>
                                        <select
                                            value={rSalesCol}
                                            onChange={(e) => setRSalesCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select sales metric</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Quantity / Stock Metric</label>
                                        <select
                                            value={rInventoryCol}
                                            onChange={(e) => setRInventoryCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select quantity metric</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        onClick={runRecommendations}
                                        disabled={rLoading || !rProductCol || !rSalesCol || !rInventoryCol}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {rLoading ? "Computing Pareto & ROP..." : "Generate Action Specs →"}
                                    </button>
                                </div>
                            )}

                            {activeTab === "detect" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-foreground border-b border-border-color pb-2 uppercase">Anomaly Config</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Target Numeric Metric</label>
                                        <select
                                            value={aColumn}
                                            onChange={(e) => setAColumn(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select metric</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-brand-secondary leading-relaxed">
                                        Uses Robust Median Absolute Deviation (MAD), Tukey extreme fences, and Isolation Forest for multivariate contradiction detection.
                                    </p>
                                    <button
                                        onClick={runAnomalyDetection}
                                        disabled={aLoading || !aColumn}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {aLoading ? "Detecting Outliers..." : "Detect Anomalies →"}
                                    </button>
                                </div>
                            )}

                            {activeTab === "rootcause" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-foreground border-b border-border-color pb-2 uppercase">Root-Cause Config</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Metric to Analyze</label>
                                        <select
                                            value={rcMetricCol}
                                            onChange={(e) => setRcMetricCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Auto-detect metric</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Inquiry Question (optional)</label>
                                        <input
                                            type="text"
                                            value={rcQuestion}
                                            onChange={(e) => setRcQuestion(e.target.value)}
                                            placeholder="Why did revenue drop?"
                                            className="saas-input w-full font-mono text-xs"
                                        />
                                    </div>
                                    <button
                                        onClick={runRootCause}
                                        disabled={rcLoading}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {rcLoading ? "Decomposing Drivers..." : "Run Root-Cause Analysis →"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT RESULTS AREA */}
                        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs">
                            
                            {/* TAB 1: FORECAST */}
                            {activeTab === "forecast" && (
                                <div className="h-full flex flex-col">
                                    {fResult ? (
                                        <div className="paper-sheet p-5 h-full flex flex-col relative overflow-hidden">
                                            <div className="flex flex-wrap items-center justify-between mb-4 pb-4 border-b border-border-color gap-3">
                                                <div>
                                                    <h4 className="text-xs font-bold text-foreground uppercase flex items-center gap-2">
                                                        <span>Time-Series Projections</span>
                                                        <TechnicalBadge text={fResult.frequency || "Adaptive"} status="blueprint" />
                                                    </h4>
                                                    <p className="text-[11px] text-brand-secondary mt-0.5">
                                                        ENGINE: <span className="text-foreground font-bold">{fResult.model_engine || "AutoML Holt-Winters"}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block">Direction</span>
                                                        <span className={`font-bold ${fResult.trend === 'up' ? 'text-status-success' : 'text-status-danger'}`}>
                                                            {fResult.trend === 'up' ? 'Upward ↗' : 'Downward ↘'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block">Holdout Confidence</span>
                                                        <span className="font-bold text-status-success">
                                                            {fResult.confidence ? `${fResult.confidence}%` : `${(fResult.r2_score * 100).toFixed(1)}%`}
                                                        </span>
                                                    </div>
                                                    {fResult.test_mape !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] text-brand-secondary uppercase block">Test MAPE</span>
                                                            <span className="font-bold text-foreground">
                                                                {(fResult.test_mape * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-h-100">
                                                <Visualizer
                                                    type="line"
                                                    data={forecastChartData}
                                                    labelKey="date"
                                                    valueKey={scenarioMultiplier !== 1.0 ? "scenario" : "value"}
                                                    title={`${fPeriods}-Period ${fResult.frequency || 'Weekly'} Forecast for ${fValueCol}`}
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <WhatIfPanel
                                                    baseValue={forecastBaseValue}
                                                    label={fValueCol}
                                                    forecastValues={fResult.values}
                                                    forecastDates={fResult.dates}
                                                    onScenarioChange={setScenarioMultiplier}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO FORECAST EXECUTED</p>
                                            <p className="text-[11px]">Select date and metric columns on the left to run tournament forecasting.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: REGRESSION */}
                            {activeTab === "predict" && (
                                <div>
                                    {pResult ? (
                                        <div className="space-y-6">
                                            <div className="paper-sheet p-5">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-xs font-bold text-foreground uppercase">AUTOML REGRESSION PERFORMANCE</h4>
                                                    <TechnicalBadge text={pResult.model_engine || "AutoML Engine"} status="blueprint" />
                                                </div>
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-border-color p-4 rounded bg-surface-200">
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block mb-1">Test R² Score</span>
                                                        <span className={`text-xl font-black ${
                                                            pResult.r2_score > 0.7 ? "text-status-success" :
                                                            pResult.r2_score > 0.4 ? "text-status-warning" : "text-status-danger"
                                                        }`}>
                                                            {pResult.r2_score.toFixed(4)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block mb-1">Adjusted R²</span>
                                                        <span className="text-xl font-black text-foreground">
                                                            {pResult.adjusted_r2 ? pResult.adjusted_r2.toFixed(4) : "—"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block mb-1">Holdout MAE</span>
                                                        <span className="text-xl font-black text-foreground">
                                                            ${pResult.mae ? pResult.mae.toLocaleString() : "—"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block mb-1">Holdout RMSE</span>
                                                        <span className="text-xl font-black text-foreground">
                                                            ${pResult.rmse ? pResult.rmse.toLocaleString() : "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="paper-sheet overflow-hidden">
                                                <div className="p-3 bg-surface-200 border-b border-border-color flex justify-between items-center">
                                                    <h4 className="text-xs font-bold text-foreground uppercase">FEATURE COEFFICIENT WEIGHTS & IMPORTANCES</h4>
                                                    <span className="text-[10px] text-brand-secondary">Normalized Impact</span>
                                                </div>
                                                <table className="saas-table">
                                                    <thead>
                                                        <tr>
                                                            <th>FEATURE VARIABLE</th>
                                                            <th className="text-right">COEFFICIENT / IMPORTANCE</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(pResult.coefficients).map(([feat, coeff]: [string, any]) => (
                                                            <tr key={feat}>
                                                                <td className="font-bold text-foreground">{feat}</td>
                                                                <td className={`text-right font-bold ${coeff > 0 ? "text-status-success" : "text-status-danger"}`}>
                                                                    {coeff > 0 ? "+" : ""}{coeff.toFixed(4)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {pResult.intercept !== undefined && (
                                                            <tr className="bg-surface-200 font-bold">
                                                                <td>Base Intercept (β₀)</td>
                                                                <td className="text-right text-foreground">{pResult.intercept.toFixed(4)}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO REGRESSION EXECUTED</p>
                                            <p className="text-[11px]">Select target and features to run AutoML regularized regression.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: RECOMMENDATIONS / INVENTORY */}
                            {activeTab === "recommend" && (
                                <div>
                                    {rResult.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="paper-sheet overflow-hidden">
                                                <div className="p-3 bg-surface-200 border-b border-border-color flex justify-between items-center">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-foreground uppercase">INVENTORY ACTION SPECIFICATIONS (ABC PARETO & ROP)</h4>
                                                        <p className="text-[10px] text-brand-secondary">Class A: Top 80% Revenue Drivers | Class C: Long-Tail Liquidation</p>
                                                    </div>
                                                    <TechnicalBadge text={`${rResult.length} ACTION SPECS`} status="blueprint" />
                                                </div>
                                                <table className="saas-table">
                                                    <thead>
                                                        <tr>
                                                            <th>PRODUCT / SKU</th>
                                                            <th>ABC SEGMENT</th>
                                                            <th>VELOCITY</th>
                                                            <th>RECOMMENDED ACTION</th>
                                                            <th>REASON SPEC</th>
                                                            <th>PRIORITY</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rResult.map((rec, i) => (
                                                            <tr key={i}>
                                                                <td className="font-bold text-foreground max-w-48 truncate" title={rec.product}>
                                                                    {rec.product}
                                                                </td>
                                                                <td>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                        rec.category?.includes('Class A') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                                                                        rec.category?.includes('Class C') ? 'bg-slate-500/10 text-slate-400 border border-slate-500/30' :
                                                                        'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                                                                    }`}>
                                                                        {rec.category || "Standard"}
                                                                    </span>
                                                                </td>
                                                                <td className="text-foreground font-mono">
                                                                    {rec.velocity !== undefined ? `${rec.velocity} u/d` : "—"}
                                                                </td>
                                                                <td className="text-foreground font-bold">
                                                                    {rec.action}
                                                                </td>
                                                                <td className="text-brand-secondary text-[11px] max-w-72">
                                                                    {rec.reason}
                                                                </td>
                                                                <td>
                                                                    <TechnicalBadge 
                                                                        text={rec.priority} 
                                                                        status={rec.priority === 'High' ? 'warning' : 'blueprint'} 
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO RECOMMENDATIONS GENERATED</p>
                                            <p className="text-[11px]">Select product and metric columns to generate supply-chain action specs.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 4: ANOMALIES */}
                            {activeTab === "detect" && (
                                <div>
                                    {aResult && aResult.anomalies && aResult.anomalies.length > 0 ? (
                                        <div className="space-y-4">
                                            {aResult.explanation && (
                                                <div className="paper-sheet p-4 bg-indigo-500/5 border-l-2 border-l-(--brand-primary)">
                                                    <h4 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <span className="text-xl">✨</span> Executive Anomaly Intelligence
                                                    </h4>
                                                    <p className="text-[11px] text-(--brand-secondary) leading-relaxed">
                                                        {aResult.explanation}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="paper-sheet overflow-hidden">
                                                <div className="p-3 bg-surface-200 border-b border-border-color flex justify-between items-center">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-foreground uppercase">ANOMALY LOG ({aColumn})</h4>
                                                        <p className="text-[10px] text-brand-secondary">Robust MAD + Tukey Fences + Isolation Forest</p>
                                                    </div>
                                                    <TechnicalBadge text={`${aResult.anomalies.length} OUTLIERS`} status="warning" />
                                                </div>
                                                <table className="saas-table">
                                                    <thead>
                                                        <tr>
                                                            <th>ROW INDEX</th>
                                                            <th>VALUE</th>
                                                            <th>ARCHETYPE</th>
                                                            <th>Z-SCORE</th>
                                                            <th>SEVERITY</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {aResult.anomalies.map((ano: any, i: number) => (
                                                            <tr key={i}>
                                                                <td className="font-bold text-foreground">#{ano.row_index}</td>
                                                                <td className="font-bold text-foreground">${Number(ano.value).toLocaleString()}</td>
                                                                <td>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                        ano.anomaly_type?.includes('Spike') ? 'bg-emerald-500/10 text-emerald-500' :
                                                                        ano.anomaly_type?.includes('Deficit') ? 'bg-rose-500/10 text-rose-500' :
                                                                        'bg-purple-500/10 text-purple-400'
                                                                    }`}>
                                                                        {ano.anomaly_type || ano.deviation}
                                                                    </span>
                                                                </td>
                                                                <td className={`font-bold ${Math.abs(ano.z_score) > 5 ? "text-status-danger font-black" : "text-status-warning"}`}>
                                                                    {ano.z_score.toFixed(2)}σ
                                                                </td>
                                                                <td>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 bg-surface-300 rounded-full h-1.5 overflow-hidden">
                                                                            <div 
                                                                                className="bg-rose-500 h-1.5 rounded-full" 
                                                                                style={{ width: `${ano.severity_score || 70}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] text-brand-secondary font-bold">
                                                                            {ano.severity_score ? `${ano.severity_score}%` : "High"}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO ANOMALIES DETECTED</p>
                                            <p className="text-[11px]">Select a metric to run robust multi-factor anomaly detection.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 5: ROOT CAUSE */}
                            {activeTab === "rootcause" && (
                                <div>
                                    {rcResult ? (
                                        <div className="space-y-6">
                                            <div className="paper-sheet p-5">
                                                <h4 className="text-xs font-bold text-foreground uppercase mb-2">EXECUTIVE ROOT-CAUSE DECOMPOSITION</h4>
                                                <p className="text-foreground leading-relaxed text-sm mb-4">{rcResult.narrative}</p>
                                                
                                                {/* Period Totals */}
                                                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                                                    <div className="bg-surface-200 border border-border-color rounded p-3 text-center">
                                                        <span className="text-brand-secondary uppercase text-[10px] block">Prior Window</span>
                                                        <span className="font-bold text-lg text-foreground">${rcResult.prior_total?.toLocaleString()}</span>
                                                        {rcResult.prior_transactions && (
                                                            <span className="text-[10px] text-brand-secondary block mt-1">
                                                                {rcResult.prior_transactions} orders @ ${rcResult.prior_avg_ticket?.toFixed(2)}/ord
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="bg-surface-200 border border-border-color rounded p-3 text-center">
                                                        <span className="text-brand-secondary uppercase text-[10px] block">Recent Window</span>
                                                        <span className="font-bold text-lg text-foreground">${rcResult.recent_total?.toLocaleString()}</span>
                                                        {rcResult.recent_transactions && (
                                                            <span className="text-[10px] text-brand-secondary block mt-1">
                                                                {rcResult.recent_transactions} orders @ ${rcResult.recent_avg_ticket?.toFixed(2)}/ord
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`border rounded p-3 text-center ${rcResult.delta >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                                                        <span className="text-brand-secondary uppercase text-[10px] block">Net Delta</span>
                                                        <span className={`font-bold text-lg ${rcResult.delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {rcResult.delta >= 0 ? '+' : ''}${rcResult.delta?.toLocaleString()} ({rcResult.delta_pct > 0 ? '+' : ''}{rcResult.delta_pct}%)
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Mathematical Volume vs. Ticket Decomposition */}
                                                {(rcResult.volume_effect !== undefined && rcResult.rate_effect !== undefined) && (
                                                    <div className="mt-4 pt-4 border-t border-border-color">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[10px] font-bold uppercase text-brand-secondary">
                                                                MATHEMATICAL VOLUME VS. PRICE DECOMPOSITION (100% CONSERVED)
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="p-3 rounded border border-border-color bg-surface-200">
                                                                <span className="text-[10px] text-brand-secondary uppercase block">Transaction Volume Impact</span>
                                                                <span className={`text-base font-bold ${rcResult.volume_effect >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {rcResult.volume_effect >= 0 ? '+' : ''}${rcResult.volume_effect?.toLocaleString()}
                                                                </span>
                                                                <p className="text-[10px] text-brand-secondary mt-1">Impact attributable solely to transaction count fluctuation.</p>
                                                            </div>
                                                            <div className="p-3 rounded border border-border-color bg-surface-200">
                                                                <span className="text-[10px] text-brand-secondary uppercase block">Average Ticket Size (Rate) Impact</span>
                                                                <span className={`text-base font-bold ${rcResult.rate_effect >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {rcResult.rate_effect >= 0 ? '+' : ''}${rcResult.rate_effect?.toLocaleString()}
                                                                </span>
                                                                <p className="text-[10px] text-brand-secondary mt-1">Impact attributable to price and basket size per order.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {rcResult.breakdowns?.map((bd: any, i: number) => (
                                                <div key={i} className="paper-sheet overflow-hidden">
                                                    <div className="p-3 bg-surface-200 border-b border-border-color flex justify-between items-center">
                                                        <h4 className="text-xs font-bold text-foreground uppercase">
                                                            Breakdown by {bd.dimension}
                                                        </h4>
                                                        <TechnicalBadge text={`Δ ${bd.total_delta?.toLocaleString()}`} status="warning" />
                                                    </div>
                                                    <table className="saas-table">
                                                        <thead>
                                                            <tr>
                                                                <th>SEGMENT</th>
                                                                <th className="text-right">PRIOR</th>
                                                                <th className="text-right">RECENT</th>
                                                                <th className="text-right">DELTA</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {bd.top_movers?.map((m: any, j: number) => (
                                                                <tr key={j}>
                                                                    <td className="font-bold">{m.segment}</td>
                                                                    <td className="text-right">${m.prior?.toLocaleString()}</td>
                                                                    <td className="text-right">${m.recent?.toLocaleString()}</td>
                                                                    <td className={`text-right font-bold ${m.delta >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                                                                        {m.delta > 0 ? '+' : ''}${m.delta?.toLocaleString()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO ROOT-CAUSE ANALYSIS</p>
                                            <p className="text-[11px]">Select a metric and run analysis to decompose business drivers.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
