"use client";

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    ChartOptions,
    ChartData,
    Filler
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

interface VisualizerProps {
    type: 'bar' | 'line' | 'pie';
    data: any[];
    labelKey: string;
    valueKey: string;
    title: string;
}

export default function Visualizer({ type, data, labelKey, valueKey, title }: VisualizerProps) {
    const primaryColors = [
        'rgba(79, 70, 229, 0.8)',   // indigo-600
        'rgba(124, 58, 237, 0.8)',  // violet-600
        'rgba(236, 72, 153, 0.8)',  // pink-500
        'rgba(6, 182, 212, 0.8)',   // cyan-500
        'rgba(16, 185, 129, 0.8)',  // emerald-500
        'rgba(245, 158, 11, 0.8)',  // amber-500
    ];

    const chartData: ChartData<any> = {
        labels: data.map(item => item[labelKey]),
        datasets: [
            {
                label: title,
                data: data.map(item => item[valueKey]),
                backgroundColor: type === 'pie' ? primaryColors : 'rgba(79, 70, 229, 0.7)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                borderRadius: type === 'bar' ? 12 : 0,
                tension: 0.4,
                fill: type === 'line' ? true : false,
                backgroundColorFill: 'rgba(79, 70, 229, 0.1)',
                pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
            },
        ],
    };

    const options: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: type === 'pie',
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 30,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 11,
                        weight: 'bold'
                    },
                    color: '#64748b'
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: 16,
                titleFont: { size: 12, family: 'Inter', weight: '900' },
                bodyFont: { size: 14, family: 'Inter', weight: '500' },
                cornerRadius: 16,
                displayColors: true,
                boxPadding: 8,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            }
        },
        scales: type !== 'pie' ? {
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.03)',
                },
                ticks: {
                    font: {
                        family: 'Inter',
                        size: 10,
                        weight: 'bold'
                    },
                    color: '#94a3b8',
                    padding: 10
                }
            },
            x: {
                border: { display: false },
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: 'Inter',
                        size: 10,
                        weight: 'bold'
                    },
                    color: '#94a3b8',
                    padding: 10
                }
            }
        } : undefined,
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-2">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Live Analytical Visualization</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-1.5 p-2 bg-slate-50 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75"></span>
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150"></span>
                    </div>
                </div>
            </div>
            <div className="flex-1 relative min-h-[350px]">
                {(!data || data.length === 0) ? (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Insufficient data context for rendering
                    </div>
                ) : (
                    <>
                        {type === 'bar' && <Bar data={chartData} options={options} />}
                        {type === 'line' && <Line data={chartData} options={options} />}
                        {type === 'pie' && <Pie data={chartData} options={options} />}
                    </>
                )}
            </div>
        </div>
    );
}
