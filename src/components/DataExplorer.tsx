"use client";

import React, { useState, useEffect } from 'react';
import Visualizer from './Visualizer';
import { useToast } from './Toast';
import { apiFetch } from '@/lib/api';
import IntelligenceReport from './IntelligenceReport';
import DataStreamTab from './explorer/DataStreamTab';
import StatsTab from './explorer/StatsTab';
import VisualsTab from './explorer/VisualsTab';
import CopilotTab from './explorer/CopilotTab';
import IntelligenceTab from './explorer/IntelligenceTab';

import { useRouter } from 'next/navigation';

interface DataExplorerProps {
    datasetId: number;
    activeModule?: string;
}



export default function DataExplorer({ datasetId, activeModule }: DataExplorerProps) {

    const router = useRouter();
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [dimensions, setDimensions] = useState<string[]>([]);
    const [measures, setMeasures] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'preview' | 'stats' | 'visualize' | 'copilot' | 'intelligence'>('preview');
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const [dataset, setDataset] = useState<any>(null);

    // Copilot State
    const [nlQuery, setNlQuery] = useState('');
    const [nlResponse, setNlResponse] = useState<any>(null);
    const [nlLoading, setNlLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [report, setReport] = useState<any>(null);
    const [reportLoading, setReportLoading] = useState(false);



    // Visualization state
    const [chartConfig, setChartConfig] = useState<{
        type: 'bar' | 'line' | 'pie';
        labelCol: string;
        valueCol: string;
        aggFunc: 'sum' | 'mean' | 'count';
    }>({
        type: 'bar',
        labelCol: '',
        valueCol: '',
        aggFunc: 'sum'
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [isGeneratingChart, setIsGeneratingChart] = useState(false);

    useEffect(() => {
        if (typeof activeModule === 'string') {
            if (activeModule.includes("Intelligence")) setActiveTab("intelligence");
            else setActiveTab("copilot");
        }
    }, [activeModule]);



    useEffect(() => {
        fetchDatasetInfo();
        fetchPreview();
        fetchStats();
    }, [datasetId]);

    const fetchDatasetInfo = async () => {
        try {
            const result = await apiFetch(`/datasets/${datasetId}`);
            setDataset(result);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPreview = async () => {
        try {
            const result = await apiFetch(`/datasets/${datasetId}/preview`);
            setData(result.data);
            setColumns(result.columns);
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to fetch preview', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const result = await apiFetch(`/datasets/${datasetId}/stats`);
            setStats(result);

            // Intelligently separate dimensions (categorical) and measures (numerical)
            const dimCols = result.filter((s: any) => s.type === 'object' || s.type === 'str' || s.type === 'string' || s.type.includes('datetime')).map((s: any) => s.name);
            const measCols = result.filter((s: any) => s.type.includes('int') || s.type.includes('float')).map((s: any) => s.name);

            setDimensions(dimCols);
            setMeasures(measCols);

            if (!chartConfig.labelCol) {
                const stringCol = dimCols.length > 0 ? dimCols[0] : (result.length > 0 ? result[0].name : '');
                const numCol = measCols.length > 0 ? measCols[0] : (result.length > 1 ? result[1].name : '');

                if (stringCol && numCol) {
                    setChartConfig(prev => ({ ...prev, labelCol: stringCol, valueCol: numCol }));
                }
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to fetch statistics', 'error');
        }
    };

    const handleGenerateChart = async () => {
        if (!chartConfig.labelCol || !chartConfig.valueCol) return;

        setIsGeneratingChart(true);
        try {
            const result = await apiFetch(`/datasets/${datasetId}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_by: {
                        columns: [chartConfig.labelCol],
                        agg_funcs: { [chartConfig.valueCol]: chartConfig.aggFunc }
                    },
                    limit: 10
                }),
            });

            setChartData(result.data);
            addToast('Chart generated successfully', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to generate chart', 'error');
        } finally {
            setIsGeneratingChart(false);
        }
    };

    const exportToCSV = () => {
        const escapeCsvValue = (val: any): string => {
            const str = val == null ? '' : String(val);
            // Escape if contains comma, quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const headers = columns.map(escapeCsvValue).join(',');
        const rows = data.map(row => columns.map(col => escapeCsvValue(row[col])).join(','));
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset_${datasetId}_export.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        addToast('Data exported successfully', 'success');
    };

    useEffect(() => {
        if (activeTab === 'visualize' && chartConfig.labelCol && chartConfig.valueCol) {
            handleGenerateChart();
        }
        if (activeTab === 'copilot' && suggestions.length === 0) {
            fetchSuggestions();
        }
        if (activeTab === 'intelligence' && !report && !reportLoading) {
            // Optional: Auto-trigger report if needed, or leave to manual
        }
    }, [activeTab, chartConfig.labelCol, chartConfig.valueCol, chartConfig.aggFunc]);

    const fetchSuggestions = async () => {
        try {
            const result = await apiFetch(`/datasets/${datasetId}/suggest-queries`);
            setSuggestions(result);
        } catch { /* ignore */ }
    };

    const fetchReport = async () => {
        setReportLoading(true);
        try {
            const result = await apiFetch(`/analytics/${datasetId}/report`);
            setReport(result);
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to generate intelligence report', 'error');
        } finally {
            setReportLoading(false);
        }
    };



    const handleNLQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nlQuery.trim()) {
            addToast('Please enter a question for the AI to analyze', 'info');
            return;
        }

        setNlLoading(true);
        try {
            const result = await apiFetch(`/datasets/${datasetId}/nl-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: nlQuery }),
            });
            setNlResponse(result);
            addToast('Query processed successfully', 'success');

            // Log query to localStorage for History tab
            try {
                const log = JSON.parse(localStorage.getItem('bi_query_log') || '[]');
                log.push({ query: nlQuery, time: new Date().toLocaleString() });
                localStorage.setItem('bi_query_log', JSON.stringify(log.slice(-50))); // Keep last 50
            } catch { /* ignore */ }
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to process natural language query', 'error');
        } finally {
            setNlLoading(false);
        }
    };

    const filteredData = data.filter(row =>
        Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="w-full min-h-[90vh] flex flex-col pt-2 animate-in fade-in duration-500 pb-20">
            <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[40px] shadow-2xl w-full flex flex-col border border-white/50 dark:border-white/5">

                {/* Colorful Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-wrap gap-4 justify-between items-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient rounded-t-[40px]">
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Intelligence Explorer</h2>
                            <p className="text-xs text-white/70 font-black uppercase tracking-widest">Active Probe #{datasetId}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={exportToCSV}
                            className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-white hover:text-slate-900 shadow-xl transition-all duration-500 flex items-center gap-3 active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Export Stream
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-11 h-11 bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-red-500 shadow-xl transition-all duration-500 active:scale-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                {/* Dynamic Tabs */}
                <div className="flex px-10 border-b border-slate-100 dark:border-white/5 items-center justify-between bg-white/50 dark:bg-slate-900/50 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-10 whitespace-nowrap">
                        {['preview', 'stats', 'visualize', 'copilot', 'intelligence'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border-b-4 relative ${activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600 scale-110'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                            >
                                {tab === 'preview' ? 'Data Stream' : tab === 'stats' ? 'Metrics' : tab === 'visualize' ? 'Visuals' : tab === 'copilot' ? 'AI Copilot' : '⚡ Intelligence'}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 blur-[2px]"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* High-Fi Content Area */}
                <div className="p-10 bg-white/30 dark:bg-slate-900/30 min-h-[500px]">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-8 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 w-16 h-16 border-8 border-transparent border-b-purple-500 rounded-full animate-spin [animation-duration:1.5s]"></div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Scanning Data Packets...</p>
                        </div>
                    ) : activeTab === 'preview' ? (
                        <DataStreamTab 
                            columns={columns} 
                            filteredData={filteredData} 
                            searchTerm={searchTerm} 
                            setSearchTerm={setSearchTerm} 
                        />
                    ) : activeTab === 'stats' ? (
                        <StatsTab 
                            stats={stats} 
                            dataset={dataset} 
                            data={data} 
                        />
                    ) : activeTab === 'visualize' ? (
                        <VisualsTab 
                            chartConfig={chartConfig} 
                            setChartConfig={setChartConfig} 
                            dimensions={dimensions} 
                            measures={measures} 
                            isGeneratingChart={isGeneratingChart} 
                            chartData={chartData} 
                        />
                    ) : activeTab === 'copilot' ? (
                        <CopilotTab 
                            nlQuery={nlQuery} 
                            setNlQuery={setNlQuery} 
                            handleNLQuery={handleNLQuery} 
                            nlLoading={nlLoading} 
                            suggestions={suggestions} 
                            nlResponse={nlResponse} 
                        />
                    ) : (
                        <IntelligenceTab 
                            report={report} 
                            reportLoading={reportLoading} 
                            fetchReport={fetchReport} 
                        />
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white/30 dark:bg-slate-900/80 backdrop-blur-md border-t border-indigo-100/30 dark:border-white/5 flex justify-end gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all duration-300 active:scale-95"
                    >
                        Back to Library
                    </button>
                    {/* Only show modal trigger if NOT on Intelligence tab to avoid redundancy */}
                    {activeTab !== 'intelligence' && <IntelligenceReport datasetId={datasetId} />}
                </div>

            </div>
        </div>
    );
}
