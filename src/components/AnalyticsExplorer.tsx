"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "./Toast";
import Visualizer from "./Visualizer";
import { PaperTape, TechnicalBadge } from "./PaperAccents";

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
        try {
            const result = await apiFetch(`/analytics/${datasetId}/forecast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date_col: fDateCol, value_col: fValueCol, periods: fPeriods }),
            });
            setFResult(result);
            addToast("Forecast model completed", "success");
        } catch (e: any) {
            addToast(e.message || "Forecast failed", "error");
        } finally {
            setFLoading(false);
        }
    };

    // ---- Predict ----
    const toggleFeatureCol = (col: string) => {
        setPFeatureCols((prev) =>
            prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
        );
    };

    const runPredict = async () => {
        if (!pTargetCol || pFeatureCols.length === 0) {
            addToast("Select target and features", "error");
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
            addToast("Regression complete", "success");
        } catch (e: any) {
            addToast(e.message || "Regression failed", "error");
        } finally {
            setPLoading(false);
        }
    };

    // ---- Recommend ----
    const runRecommendations = async () => {
        if (!rProductCol || !rSalesCol || !rInventoryCol) {
            addToast("Select all required columns", "error");
            return;
        }
        setRLoading(true);
        setRResult([]);
        try {
            const result = await apiFetch(
                `/analytics/${datasetId}/recommendations?product_col=${encodeURIComponent(rProductCol)}&sales_col=${encodeURIComponent(rSalesCol)}&inventory_col=${encodeURIComponent(rInventoryCol)}`
            );
            setRResult(result);
            addToast(`Generated ${result.length} recommendations`, "success");
        } catch (e: any) {
            addToast(e.message || "Recommendations failed", "error");
        } finally {
            setRLoading(false);
        }
    };

    // ---- Anomalies ----
    const runAnomalyDetection = async () => {
        if (!aColumn) {
            addToast("Select a numeric column", "error");
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
            addToast(`Detected ${result.length} anomalies`, "success");
        } catch (e: any) {
            addToast(e.message || "Anomaly detection failed", "error");
        } finally {
            setALoading(false);
        }
    };

    const forecastChartData = fResult
        ? fResult.dates.map((d: string, i: number) => ({ date: d, value: fResult.values[i] }))
        : [];

    const tabs: { key: AnalyticsTab; label: string }[] = [
        { key: "forecast", label: "TIME SERIES FORECAST" },
        { key: "predict", label: "REGRESSION ANALYSIS" },
        { key: "recommend", label: "INVENTORY ACTION SPECS" },
        { key: "detect", label: "ANOMALY DETECTION" },
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
                    <p className="text-[11px] text-brand-secondary">Execute linear models, time-series projections & anomaly matrices</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-border-color bg-surface-200 px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-3 text-xs font-mono font-bold tracking-wider transition-colors border-b-2 uppercase ${
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
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Value Metric</label>
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
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Periods (Days)</label>
                                        <input
                                            type="number"
                                            value={fPeriods}
                                            min={7}
                                            max={365}
                                            onChange={(e) => setFPeriods(parseInt(e.target.value))}
                                            className="saas-input w-full font-mono text-xs"
                                        />
                                    </div>
                                    <button
                                        onClick={runForecast}
                                        disabled={fLoading || !fDateCol || !fValueCol}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {fLoading ? "Processing..." : "Run Forecast Model →"}
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
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-2">Feature Variables (X)</label>
                                        <div className="space-y-1 max-h-48 overflow-y-auto border border-border-color rounded p-2 bg-surface-100">
                                            {numericCols.filter(c => c !== pTargetCol).map(col => (
                                                <label key={col} className="flex items-center gap-2 text-xs p-1 hover:bg-surface-200 rounded cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={pFeatureCols.includes(col)}
                                                        onChange={() => toggleFeatureCol(col)}
                                                        className="rounded text-brand-primary"
                                                    />
                                                    <span className="text-foreground font-mono">{col}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={runPredict}
                                        disabled={pLoading || !pTargetCol || pFeatureCols.length === 0}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {pLoading ? "Processing..." : "Run Regression Model →"}
                                    </button>
                                </div>
                            )}

                            {activeTab === "recommend" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-foreground border-b border-border-color pb-2 uppercase">Recommendation Config</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Product Identifier</label>
                                        <select
                                            value={rProductCol}
                                            onChange={(e) => setRProductCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select identifier</option>
                                            {[...categoryCols, ...numericCols].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Sales Metric</label>
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
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Inventory Metric</label>
                                        <select
                                            value={rInventoryCol}
                                            onChange={(e) => setRInventoryCol(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select inventory metric</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        onClick={runRecommendations}
                                        disabled={rLoading || !rProductCol || !rSalesCol || !rInventoryCol}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {rLoading ? "Processing..." : "Generate Action Specs →"}
                                    </button>
                                </div>
                            )}

                            {activeTab === "detect" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-foreground border-b border-border-color pb-2 uppercase">Anomaly Config</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-secondary uppercase mb-1">Metric to Analyze</label>
                                        <select
                                            value={aColumn}
                                            onChange={(e) => setAColumn(e.target.value)}
                                            className="saas-input w-full font-mono text-xs"
                                        >
                                            <option value="">Select metric</option>
                                            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        onClick={runAnomalyDetection}
                                        disabled={aLoading || !aColumn}
                                        className="saas-button saas-button-primary w-full mt-2 uppercase font-mono text-xs"
                                    >
                                        {aLoading ? "Processing..." : "Detect Anomalies →"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT RESULTS AREA */}
                        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs">
                            
                            {activeTab === "forecast" && (
                                <div className="h-full flex flex-col">
                                    {fResult ? (
                                        <div className="paper-sheet p-5 h-full flex flex-col relative overflow-hidden">
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-color">
                                                <div>
                                                    <h4 className="text-xs font-bold text-foreground uppercase">Forecast Projections</h4>
                                                    <p className="text-[11px] text-brand-secondary">ENGINE: {fResult.model_engine || "Linear Regression"}</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block">Trend</span>
                                                        <span className={`font-bold ${fResult.trend === 'up' ? 'text-status-success' : 'text-status-danger'}`}>
                                                            {fResult.trend === 'up' ? 'Upward ↗' : 'Downward ↘'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block">R² Score</span>
                                                        <span className="font-bold text-foreground">{(fResult.r2_score).toFixed(3)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-h-100">
                                                <Visualizer
                                                    type="line"
                                                    data={forecastChartData}
                                                    labelKey="date"
                                                    valueKey="value"
                                                    title={`${fPeriods}-Day Forecast for ${fValueCol}`}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO FORECAST EXECUTED</p>
                                            <p className="text-[11px]">Configure parameters on the left and run the forecast model.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "predict" && (
                                <div>
                                    {pResult ? (
                                        <div className="space-y-6">
                                            <div className="paper-sheet p-5">
                                                <h4 className="text-xs font-bold text-foreground uppercase mb-1">REGRESSION MODEL PERFORMANCE</h4>
                                                <div className="flex items-center gap-4 border border-border-color p-4 rounded bg-surface-200 mt-3">
                                                    <div>
                                                        <span className="text-[10px] text-brand-secondary uppercase block mb-1">R-Squared (R²)</span>
                                                        <span className={`text-2xl font-black ${
                                                            pResult.r2_score > 0.7 ? "text-status-success" :
                                                            pResult.r2_score > 0.4 ? "text-status-warning" : "text-status-danger"
                                                        }`}>
                                                            {pResult.r2_score.toFixed(4)}
                                                        </span>
                                                    </div>
                                                    <div className="pl-4 border-l border-border-color">
                                                        <p className="text-xs text-foreground">
                                                            {pResult.r2_score > 0.7 ? "Strong fit. Features explain target variance effectively." :
                                                             pResult.r2_score > 0.4 ? "Moderate fit. Features provide partial predictive signal." :
                                                             "Weak fit. Features do not explain target variable variance."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="paper-sheet overflow-hidden">
                                                <div className="p-3 bg-surface-200 border-b border-border-color">
                                                    <h4 className="text-xs font-bold text-foreground uppercase">FEATURE COEFFICIENT WEIGHTS</h4>
                                                </div>
                                                <table className="saas-table">
                                                    <thead>
                                                        <tr>
                                                            <th>FEATURE VARIABLE</th>
                                                            <th className="text-right">COEFFICIENT WEIGHT</th>
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
                                                        <tr className="bg-surface-200 font-bold">
                                                            <td>Intercept</td>
                                                            <td className="text-right text-foreground">{pResult.intercept.toFixed(4)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO REGRESSION EXECUTED</p>
                                            <p className="text-[11px]">Select target and features to run regression model.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "recommend" && (
                                <div>
                                    {rResult.length > 0 ? (
                                        <div className="paper-sheet overflow-hidden">
                                            <div className="p-3 bg-surface-200 border-b border-border-color flex justify-between items-center">
                                                <h4 className="text-xs font-bold text-foreground uppercase">INVENTORY ACTION MATRIX</h4>
                                                <TechnicalBadge text={`${rResult.length} SPECS`} status="blueprint" />
                                            </div>
                                            <table className="saas-table">
                                                <thead>
                                                    <tr>
                                                        <th>PRODUCT</th>
                                                        <th>ACTION REQUIRED</th>
                                                        <th>REASON SPEC</th>
                                                        <th>PRIORITY</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rResult.map((rec, i) => (
                                                        <tr key={i}>
                                                            <td className="font-bold text-foreground">{rec.product}</td>
                                                            <td className="text-foreground">{rec.action}</td>
                                                            <td className="text-brand-secondary text-xs">{rec.reason}</td>
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
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO RECOMMENDATIONS GENERATED</p>
                                            <p className="text-[11px]">Select product and metric columns to generate inventory recommendations.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "detect" && (
                                <div>
                                    {aResult.length > 0 ? (
                                        <div className="paper-sheet overflow-hidden">
                                            <div className="p-3 bg-surface-200 border-b border-border-color flex justify-between items-center">
                                                <h4 className="text-xs font-bold text-foreground uppercase">ANOMALY SPECIFICATION LOG ({aColumn})</h4>
                                                <TechnicalBadge text={`${aResult.length} DETECTED (>3σ)`} status="warning" />
                                            </div>
                                            <table className="saas-table">
                                                <thead>
                                                    <tr>
                                                        <th>ROW INDEX</th>
                                                        <th>VALUE</th>
                                                        <th>Z-SCORE</th>
                                                        <th>SKEW DIRECTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {aResult.map((ano, i) => (
                                                        <tr key={i}>
                                                            <td className="font-bold text-foreground">#{ano.row_index}</td>
                                                            <td className="font-bold text-foreground">{ano.value}</td>
                                                            <td className={`font-bold ${Math.abs(ano.z_score) > 5 ? "text-status-danger font-black" : "text-status-warning"}`}>
                                                                {ano.z_score.toFixed(3)}
                                                            </td>
                                                            <td className="font-bold text-foreground">
                                                                {ano.deviation === "High" ? "↗ Positive Skew" : "↘ Negative Skew"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-100 flex flex-col items-center justify-center border border-dashed border-border-color p-8 text-center text-brand-secondary">
                                            <p className="font-bold uppercase mb-1">NO ANOMALIES DETECTED</p>
                                            <p className="text-[11px]">Select a metric to run 3-sigma anomaly detection.</p>
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
