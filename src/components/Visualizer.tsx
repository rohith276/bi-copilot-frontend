"use client";

import React, { useEffect, useState } from 'react';
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
    Filler,
    RadialLinearScale,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter, Radar, PolarArea } from 'react-chartjs-2';
import { TechnicalBadge } from './PaperAccents';

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
    Filler,
    RadialLinearScale,
);

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'polarArea' | 'horizontalBar';

export const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: string }[] = [
    { value: 'bar',           label: 'Bar',            icon: '📊' },
    { value: 'horizontalBar', label: 'H-Bar',          icon: '📶' },
    { value: 'line',          label: 'Line',           icon: '📈' },
    { value: 'area',          label: 'Area',           icon: '🏔️' },
    { value: 'scatter',       label: 'Scatter',        icon: '⊙' },
    { value: 'pie',           label: 'Pie',            icon: '🥧' },
    { value: 'doughnut',      label: 'Donut',          icon: '🍩' },
    { value: 'radar',         label: 'Radar',          icon: '🕸️' },
    { value: 'polarArea',     label: 'Polar',          icon: '🎯' },
];

interface VisualizerProps {
    type: ChartType;
    data: any[];
    labelKey: string;
    valueKey: string;
    title?: string;
    onDrillDown?: (label: string) => void;
}

function getThemeColors() {
    if (typeof window === 'undefined') return { isDark: false };
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--background').trim();
    const isDark = bg.startsWith('#0') || bg.startsWith('#1') || bg.startsWith('#2');
    return { isDark };
}

export default function Visualizer({ type, data, labelKey, valueKey, title = '', onDrillDown }: VisualizerProps) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(getThemeColors().isDark);
    }, []);

    // Blueprint-themed palette — 10 colors to cover all slices
    const blueprintPalette = [
        isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(37, 99, 235, 0.8)',
        isDark ? 'rgba(52, 211, 153, 0.8)' : 'rgba(16, 185, 129, 0.8)',
        isDark ? 'rgba(251, 191, 36, 0.8)' : 'rgba(245, 158, 11, 0.8)',
        isDark ? 'rgba(167, 139, 250, 0.8)' : 'rgba(139, 92, 246, 0.8)',
        isDark ? 'rgba(251, 113, 133, 0.8)' : 'rgba(239, 68, 68, 0.8)',
        isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(14, 165, 233, 0.8)',
        isDark ? 'rgba(253, 164, 175, 0.8)' : 'rgba(244, 63, 94, 0.8)',
        isDark ? 'rgba(134, 239, 172, 0.8)' : 'rgba(34, 197, 94, 0.8)',
        isDark ? 'rgba(253, 186, 116, 0.8)' : 'rgba(234, 88, 12, 0.8)',
        isDark ? 'rgba(196, 181, 253, 0.8)' : 'rgba(109, 40, 217, 0.8)',
    ];

    // Theme-aware chart colors
    const primaryColor = isDark ? 'rgba(96, 165, 250, 1)' : 'rgba(37, 99, 235, 1)';
    const primaryBg = isDark ? 'rgba(96, 165, 250, 0.65)' : 'rgba(37, 99, 235, 0.65)';
    const primaryFill = isDark ? 'rgba(96, 165, 250, 0.12)' : 'rgba(37, 99, 235, 0.06)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const borderAxisColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
    const tickColor = isDark ? '#94a3b8' : '#475569';
    const pointBorderColor = isDark ? '#1e293b' : '#ffffff';

    const isRadial = type === 'pie' || type === 'doughnut' || type === 'polarArea' || type === 'radar';
    const isScatter = type === 'scatter';
    const isArea = type === 'area';
    const isHorizontal = type === 'horizontalBar';

    // Expand palette to cover all data points for multi-color charts
    const expandedPalette = data.map((_, i) => blueprintPalette[i % blueprintPalette.length]);

    // Build dataset
    const buildDataset = () => {
        if (isScatter) {
            return {
                label: title || valueKey,
                data: data.map(item => ({ x: item[labelKey], y: item[valueKey] })),
                backgroundColor: primaryBg,
                borderColor: primaryColor,
                pointBackgroundColor: primaryColor,
                pointBorderColor: pointBorderColor,
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
            };
        }

        if (isRadial) {
            return {
                label: title || valueKey,
                data: data.map(item => item[valueKey]),
                backgroundColor: expandedPalette,
                borderColor: expandedPalette.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                hoverOffset: type === 'doughnut' ? 8 : 4,
            };
        }

        // Bar, line, area, horizontalBar
        return {
            label: title || valueKey,
            data: data.map(item => item[valueKey]),
            backgroundColor: isArea ? primaryFill : primaryBg,
            borderColor: primaryColor,
            borderWidth: 2,
            borderRadius: (type === 'bar' || isHorizontal) ? 3 : 0,
            tension: 0.35,
            fill: isArea,
            pointBackgroundColor: primaryColor,
            pointBorderColor: pointBorderColor,
            pointBorderWidth: 2,
            pointRadius: (type === 'line' || isArea) ? 3 : 0,
            pointHoverRadius: 6,
        };
    };

    const chartData: ChartData<any> = {
        labels: data.map(item => item[labelKey]),
        datasets: [buildDataset()],
    };

    const monoFont = 'ui-monospace, SFMono-Regular, monospace';

    const tooltipConfig = {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        titleFont: { size: 11, family: monoFont, weight: 'bold' as const },
        bodyFont: { size: 12, family: monoFont },
        cornerRadius: 4,
        displayColors: true,
        boxPadding: 6,
        borderColor: isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.2)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
    };

    const legendConfig = {
        display: isRadial,
        position: 'bottom' as const,
        labels: {
            usePointStyle: true,
            padding: 12,
            font: { family: monoFont, size: 10, weight: 'bold' as const },
            color: tickColor,
        },
    };

    const scaleConfig = (!isRadial && !isScatter) ? {
        y: {
            beginAtZero: true,
            border: { display: true, color: borderAxisColor, width: 1 },
            grid: { display: true, color: gridColor, lineWidth: 1 },
            ticks: {
                font: { family: monoFont, size: 10 },
                color: tickColor,
                padding: 8,
                maxTicksLimit: 8,
            },
        },
        x: {
            border: { display: true, color: borderAxisColor, width: 1 },
            grid: { display: false },
            ticks: {
                font: { family: monoFont, size: 10 },
                color: tickColor,
                padding: 8,
                maxRotation: 45,
                autoSkip: true,
                maxTicksLimit: 20,
            },
        },
    } : (type === 'radar' ? {
        r: {
            beginAtZero: true,
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            pointLabels: {
                font: { family: monoFont, size: 10 },
                color: tickColor,
            },
            ticks: {
                font: { family: monoFont, size: 9 },
                color: tickColor,
                backdropColor: 'transparent',
            },
        },
    } : undefined);

    const options: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? 'y' as const : 'x' as const,
        plugins: {
            legend: legendConfig,
            title: { display: false },
            tooltip: tooltipConfig,
        },
        scales: scaleConfig,
        animation: { duration: 800, easing: 'easeOutQuart' as const },
        ...(type === 'doughnut' ? { cutout: '55%' } : {}),
        ...(onDrillDown ? {
            onClick: (_event: any, elements: any[]) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const labels = data.map(item => String(item[labelKey] ?? ''));
                    if (labels[idx]) {
                        onDrillDown(labels[idx]);
                    }
                }
            },
            onHover: (_event: any, elements: any[], chart: any) => {
                chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
        } : {}),
    };

    // Map the chart type to the correct component
    const renderChart = () => {
        if (!data || data.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-(--brand-secondary) font-bold uppercase text-xs">
                    NO DATA AVAILABLE
                </div>
            );
        }
        switch (type) {
            case 'bar':
            case 'horizontalBar':
                return <Bar data={chartData} options={options} />;
            case 'line':
            case 'area':
                return <Line data={chartData} options={options} />;
            case 'pie':
                return <Pie data={chartData} options={options} />;
            case 'doughnut':
                return <Doughnut data={chartData} options={options} />;
            case 'scatter':
                return <Scatter data={chartData} options={options} />;
            case 'radar':
                return <Radar data={chartData} options={options} />;
            case 'polarArea':
                return <PolarArea data={chartData} options={options} />;
            default:
                return <Bar data={chartData} options={options} />;
        }
    };

    // Resolve display label for the badge
    const badgeLabel = CHART_TYPE_OPTIONS.find(o => o.value === type)?.label.toUpperCase() || type.toUpperCase();

    return (
        <div className="w-full h-full flex flex-col p-1 font-mono text-xs">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h3 className="text-sm font-bold text-(--foreground) uppercase tracking-widest">{title}</h3>
                    <p className="text-[10px] text-(--brand-secondary)">VISUAL VECTOR SPECS</p>
                </div>
                <TechnicalBadge text={badgeLabel} status="blueprint" />
            </div>
            <div className="flex-1 relative min-h-75">
                {renderChart()}
            </div>
        </div>
    );
}
