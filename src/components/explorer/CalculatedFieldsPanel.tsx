"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface CalculatedField {
    id: number;
    dataset_id: number;
    name: string;
    expression: string;
}

interface Props {
    datasetId: number;
    columns: string[];
    onFieldsChange: (fields: CalculatedField[]) => void;
}

export default function CalculatedFieldsPanel({ datasetId, columns, onFieldsChange }: Props) {
    const [fields, setFields] = useState<CalculatedField[]>([]);
    const [name, setName] = useState('');
    const [expression, setExpression] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { addToast } = useToast();

    const loadFields = async () => {
        try {
            const data = await apiFetch(`/datasets/${datasetId}/calculated-fields`);
            setFields(data);
            onFieldsChange(data);
        } catch {
            // Ignore if endpoint not ready
        }
    };

    useEffect(() => {
        loadFields();
    }, [datasetId]);

    const handleCreate = async () => {
        if (!name.trim() || !expression.trim()) {
            addToast('Name and expression are required', 'error');
            return;
        }
        try {
            await apiFetch(`/datasets/${datasetId}/calculated-fields`, {
                method: 'POST',
                body: JSON.stringify({ name: name.trim(), expression: expression.trim() }),
            });
            setName('');
            setExpression('');
            setAiPrompt('');
            addToast(`Created calculated field: ${name}`, 'success');
            await loadFields();
        } catch (e) {
            addToast(`Failed to create field: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
        }
    };

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) {
            addToast('Please describe the measure you want to create', 'error');
            return;
        }
        
        setIsGenerating(true);
        try {
            const data = await apiFetch(`/datasets/${datasetId}/calculated-fields/generate`, {
                method: 'POST',
                body: JSON.stringify({ prompt: aiPrompt.trim() }),
            });
            
            if (data && data.formula) {
                setExpression(data.formula);
                if (!name.trim()) {
                    // Try to guess a name if empty
                    setName(aiPrompt.length < 20 ? aiPrompt.trim() : 'New Measure');
                }
                addToast('AI generated formula successfully', 'success');
            }
        } catch (e) {
            addToast(`Failed to generate formula: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (fieldId: number) => {
        try {
            await apiFetch(`/datasets/${datasetId}/calculated-fields/${fieldId}`, {
                method: 'DELETE',
            });
            addToast('Field deleted', 'success');
            await loadFields();
        } catch {
            addToast('Failed to delete field', 'error');
        }
    };

    return (
        <div className="border-t border-(--border-color) pt-2.5 mt-2.5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between font-mono text-xs font-bold text-(--brand-secondary) uppercase tracking-wider hover:text-(--foreground) transition-colors py-1.5"
            >
                <span>ƒx Calculated Fields ({fields.length})</span>
                <span className="text-xs">{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
                <div className="space-y-2.5 mt-2">
                    {/* Existing fields */}
                    {fields.map(f => (
                        <div
                            key={f.id}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("colName", f.name);
                                e.dataTransfer.setData("biType", "metric");
                            }}
                            className="bg-purple-500/10 border border-purple-500/30 px-2.5 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-purple-500 transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="text-xs text-purple-500 font-bold shrink-0">ƒx</span>
                                <span className="font-mono text-xs text-purple-600 dark:text-purple-400 font-bold truncate">{f.name}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 text-sm leading-none transition-opacity px-1"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {/* Create new */}
                    <div className="space-y-2 bg-(--surface) border border-(--border-color) rounded p-2.5">
                        <input 
                            type="text" 
                            placeholder="Measure Name (e.g. Profit Margin)"
                            className="w-full bg-(--surface) border border-(--border-color) rounded p-2 text-xs font-mono text-(--foreground) focus:border-(--brand-primary) outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        
                        {/* AI Generator Block */}
                        <div className="border border-(--brand-primary)/30 rounded bg-indigo-500/5 p-2.5 space-y-2">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ask AI (e.g. Profit divided by Sales)"
                                    className="flex-1 bg-(--surface) border border-(--border-color) rounded p-2 text-xs font-mono text-(--foreground) focus:border-(--brand-primary) outline-none"
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                                />
                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !aiPrompt.trim()}
                                    className="bg-(--brand-primary) text-white px-2.5 py-1.5 rounded text-xs font-mono font-bold uppercase disabled:opacity-50 flex items-center gap-1 shrink-0 hover:opacity-90 transition-opacity"
                                >
                                    {isGenerating ? (
                                        <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : '✨ AI'}
                                </button>
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-mono text-(--brand-secondary) font-bold whitespace-nowrap">Formula:</span>
                                <input 
                                    type="text" 
                                    placeholder="(Revenue - Cost) / Revenue"
                                    className="flex-1 bg-(--surface) border border-(--border-color) rounded p-1.5 text-xs font-mono text-(--brand-primary) focus:border-(--brand-primary) outline-none font-bold"
                                    value={expression}
                                    onChange={e => setExpression(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Column reference hints */}
                        <div className="flex flex-wrap gap-1">
                            {columns.slice(0, 6).map(col => (
                                <button
                                    key={col}
                                    onClick={() => setExpression(prev => prev + `"${col}"`)}
                                    className="text-[10px] font-mono bg-(--surface-hover) text-(--brand-secondary) px-1.5 py-0.5 rounded hover:text-(--foreground) transition-colors border border-(--border-color)"
                                    title={`Insert "${col}"`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleCreate}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-semibold py-2 rounded transition-colors uppercase tracking-wider shadow-sm"
                        >
                            + Create Field
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
