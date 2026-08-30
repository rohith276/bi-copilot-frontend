"use client";

import React from 'react';
import Visualizer from '../Visualizer';
import { PaperTape, TechnicalBadge } from '../PaperAccents';

interface VisualsTabProps {
    chartConfig: {
        type: 'bar' | 'line' | 'pie';
        labelCol: string;
        valueCol: string;
        aggFunc: 'sum' | 'mean' | 'count';
    };
    setChartConfig: (config: any) => void;
    dimensions: string[];
    measures: string[];
    isGeneratingChart: boolean;
    chartData: any[];
}

export default function VisualsTab({
    chartConfig,
    setChartConfig,
    dimensions,
    measures,
    isGeneratingChart,
    chartData
}: VisualsTabProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full pb-10">
            {/* Controls */}
            <div className="w-full lg:w-80 space-y-6">
                <div className="paper-sheet p-6 relative overflow-hidden font-mono text-xs">
                    <PaperTape className="left-4 top-1 -rotate-2" />
                    <h4 className="text-xs font-bold text-foreground mb-6 uppercase tracking-wider flex items-center justify-between border-b border-border-color pb-3">
                        <span>VECTOR CONFIG SPEC</span>
                        <TechnicalBadge text="CHART-CFG" status="blueprint" />
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Visualization Mode</label>
                            <select
                                value={chartConfig.type}
                                onChange={e => setChartConfig({ ...chartConfig, type: e.target.value as any })}
                                className="saas-input w-full font-mono text-xs"
                            >
                                <option value="bar">Bar Chart Spectrum</option>
                                <option value="line">Line Temporal Trend</option>
                                <option value="pie">Radial Slice Distribution</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Dimension Axis (X)</label>
                            <select
                                value={chartConfig.labelCol}
                                onChange={e => setChartConfig({ ...chartConfig, labelCol: e.target.value })}
                                className="saas-input w-full font-mono text-xs"
                            >
                                <option value="" disabled>Select Dimension</option>
                                {dimensions.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Measure Metric (Y)</label>
                            <select
                                value={chartConfig.valueCol}
                                onChange={e => setChartConfig({ ...chartConfig, valueCol: e.target.value })}
                                className="saas-input w-full font-mono text-xs"
                            >
                                <option value="" disabled>Select Measure</option>
                                {measures.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Aggregation Function</label>
                            <select
                                value={chartConfig.aggFunc}
                                onChange={e => setChartConfig({ ...chartConfig, aggFunc: e.target.value as any })}
                                className="saas-input w-full font-mono text-xs"
                            >
                                <option value="sum">Sum Aggregate</option>
                                <option value="mean">Mean Average</option>
                                <option value="count">Record Count</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="paper-sheet p-4 bg-surface-200 font-mono text-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">TELEMETRY LOG</span>
                        <TechnicalBadge text="READY" status="success" />
                    </div>
                    <p className="text-brand-secondary text-[11px] leading-relaxed">
                        Computing <strong className="text-brand-primary">{chartConfig.aggFunc.toUpperCase()}</strong> for measure <strong className="text-foreground">{chartConfig.valueCol || '---'}</strong> grouped by dimension <strong className="text-foreground">{chartConfig.labelCol || '---'}</strong>.
                    </p>
                </div>
            </div>

            {/* Visualizer Display Panel */}
            <div className="flex-1 paper-sheet p-6 flex flex-col items-center justify-center relative min-h-125 overflow-hidden">
                {isGeneratingChart ? (
                    <div className="flex flex-col items-center gap-4 font-mono text-xs">
                        <svg className="animate-spin w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-brand-secondary font-bold uppercase tracking-wider">GENERATING TECHNICAL CHART RENDERING...</p>
                    </div>
                ) : chartData.length > 0 ? (
                    <div className="w-full h-full">
                        <Visualizer
                            type={chartConfig.type}
                            data={chartData}
                            labelKey={chartConfig.labelCol}
                            valueKey={chartConfig.valueCol}
                            title={`${chartConfig.aggFunc.toUpperCase()} Distribution: ${chartConfig.valueCol} by ${chartConfig.labelCol}`}
                        />
                    </div>
                ) : (
                    <div className="text-center font-mono text-xs">
                        <div className="w-16 h-16 bg-surface-200 rounded border border-border-color flex items-center justify-center mx-auto mb-4 text-brand-secondary">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                        </div>
                        <p className="font-bold text-foreground uppercase tracking-wider mb-1">NO VISUAL VECTOR SELECTED</p>
                        <p className="text-brand-secondary text-[11px]">Select dimension (X) and measure (Y) columns in the left configuration spec panel.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
