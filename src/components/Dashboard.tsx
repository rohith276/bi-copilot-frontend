"use client";

import React, { useState, useEffect } from 'react';
import Visualizer from './Visualizer';
import { apiFetch } from '@/lib/api';
import { useToast } from './Toast';
import Link from 'next/link';

interface DashboardProps {
    datasetId: number;
}

export default function Dashboard({ datasetId }: DashboardProps) {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [charts, setCharts] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // 1. Fetch Stats for KPIs
                const statsData = await apiFetch(`/datasets/${datasetId}/stats`);
                setStats(statsData);

                // 2. Automatically prepare some charts
                const numericCols = statsData.filter((s: any) => s.type.includes('int') || s.type.includes('float')).map((s: any) => s.name);
                const categoricalCols = statsData.filter((s: any) => s.type === 'object').map((s: any) => s.name);

                if (numericCols.length > 0 && categoricalCols.length > 0) {
                    const firstCat = categoricalCols[0];
                    const firstNum = numericCols[0];
                    const secondNum = numericCols[1] || firstNum;

                    // Fetch data for 3 types of charts
                    const [barData, lineData, pieData] = await Promise.all([
                        fetchChartData(firstCat, firstNum, 'sum'),
                        fetchChartData(firstCat, secondNum, 'mean'),
                        fetchChartData(firstCat, firstNum, 'count')
                    ]);

                    setCharts([
                        { type: 'bar', data: barData, label: firstCat, value: firstNum, title: `Total ${firstNum} by ${firstCat}` },
                        { type: 'line', data: lineData, label: firstCat, value: secondNum, title: `Avg ${secondNum} Trend` },
                        { type: 'pie', data: pieData, label: firstCat, value: firstNum, title: `Distribution of ${firstCat}` }
                    ]);
                } else if (categoricalCols.length > 0) {
                    // Only category, maybe just a count chart
                    const firstCat = categoricalCols[0];
                    const countData = await fetchChartData(firstCat, firstCat, 'count');
                    setCharts([
                        { type: 'pie', data: countData, label: firstCat, value: firstCat, title: `Frequency of ${firstCat}` }
                    ]);
                }

            } catch (error) {
                addToast(error instanceof Error ? error.message : 'Failed to load dashboard', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [datasetId]);

    const fetchChartData = async (labelCol: string, valueCol: string, aggFunc: string) => {
        const result = await apiFetch(`/datasets/${datasetId}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_by: {
                    columns: [labelCol],
                    agg_funcs: { [valueCol]: aggFunc }
                },
                limit: 8
            }),
        });
        return result.data;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 border-8 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Dashboard Engine...</p>
            </div>
        );
    }

    const kpiStats = stats.filter(s => s.mean !== undefined).slice(0, 4);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiStats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.name}</p>
                        <div className="flex items-end justify-between relative z-10">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {stat.mean > 1000 ? (stat.mean / 1000).toFixed(1) + 'K' : stat.mean.toFixed(1)}
                            </h3>
                            <span className="text-[10px] font-black px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">AVG</span>
                        </div>
                        <div className="mt-4 flex gap-4 text-[10px] font-bold text-slate-400">
                            <span>MIN: {stat.min}</span>
                            <span>MAX: {stat.max}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {charts.map((chart, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl min-h-[450px] ${chart.type === 'pie' ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
                        <Visualizer
                            type={chart.type}
                            data={chart.data}
                            labelKey={chart.label}
                            valueKey={chart.value}
                            title={chart.title}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
