"use client";

import React from 'react';
import Visualizer from '../Visualizer';

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
        <div className="flex flex-col lg:flex-row gap-12 h-full pb-10">
            {/* Controls */}
            <div className="w-full lg:w-80 space-y-8">
                <div className="p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-left-6 duration-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16"></div>
                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[8px]">CFG</span>
                        Vector Configuration
                    </h4>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Visualization Mode</label>
                            <select
                                value={chartConfig.type}
                                onChange={e => setChartConfig({ ...chartConfig, type: e.target.value as any })}
                                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-slate-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                            >
                                <option value="bar">Bar Spectrum</option>
                                <option value="line">Line Temporal</option>
                                <option value="pie">Radial Slice</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Dimension (X)</label>
                            <div className="relative group">
                                <select
                                    value={chartConfig.labelCol}
                                    onChange={e => setChartConfig({ ...chartConfig, labelCol: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="" disabled>Select Dimension</option>
                                    {dimensions.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Measure (Y)</label>
                            <div className="relative group">
                                <select
                                    value={chartConfig.valueCol}
                                    onChange={e => setChartConfig({ ...chartConfig, valueCol: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="" disabled>Select Measure</option>
                                    {measures.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Processing Lock</label>
                            <select
                                value={chartConfig.aggFunc}
                                onChange={e => setChartConfig({ ...chartConfig, aggFunc: e.target.value as any })}
                                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-slate-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                            >
                                <option value="sum">Aggregate Sum</option>
                                <option value="mean">Intensity Mean</option>
                                <option value="count">Count Vectors</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[32px] text-white shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Engine Telemetry</span>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed opacity-90 italic">
                        The analytical core is currently processing <span className="font-black text-emerald-400 underline decoration-emerald-400/30 underline-offset-4">{chartConfig.aggFunc}</span> calculations for <span className="font-black text-indigo-300">{chartConfig.valueCol}</span> mapped across <span className="font-black text-purple-300">{chartConfig.labelCol}</span> dimensions.
                    </p>
                </div>
            </div>

            {/* Pro Chart Display */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-700 p-12 flex flex-col items-center justify-center relative min-h-[500px] overflow-hidden group">
                {isGeneratingChart ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Visual Frame...</p>
                    </div>
                ) : chartData.length > 0 ? (
                    <div className="w-full h-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-700">
                        <Visualizer
                            type={chartConfig.type}
                            data={chartData}
                            labelKey={chartConfig.labelCol}
                            valueKey={chartConfig.valueCol}
                            title={`${chartConfig.aggFunc.toUpperCase()} Distribution: ${chartConfig.valueCol} by ${chartConfig.labelCol}`}
                        />
                    </div>
                ) : (
                    <div className="text-center group/empty transition-transform duration-700 hover:scale-110">
                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner group-hover/empty:bg-indigo-50 group-hover/empty:text-indigo-200 transition-colors duration-500">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                        </div>
                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Visual Stream Offline</p>
                        <p className="text-[9px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full mt-4 inline-block font-bold">Select vector dimensions to initialize render</p>
                    </div>
                )}
            </div>
        </div>
    );
}
