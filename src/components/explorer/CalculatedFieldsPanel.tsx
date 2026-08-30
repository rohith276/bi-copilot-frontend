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
            addToast(`Created calculated field: ${name}`, 'success');
            await loadFields();
        } catch (e) {
            addToast(`Failed to create field: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
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
        <div className="border-t border-(--border-color) pt-2 mt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between font-mono text-[10px] font-bold text-(--brand-secondary) uppercase tracking-wider hover:text-(--foreground) transition-colors py-1"
            >
                <span>ƒx Calculated Fields ({fields.length})</span>
                <span className="text-[10px]">{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
                <div className="space-y-2 mt-2">
                    {/* Existing fields */}
                    {fields.map(f => (
                        <div
                            key={f.id}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("colName", f.name);
                                e.dataTransfer.setData("biType", "metric");
                            }}
                            className="bg-purple-500/10 border border-purple-500/30 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-purple-500 transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-1 truncate">
                                <span className="text-[10px] text-purple-500 font-bold shrink-0">ƒx</span>
                                <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-bold truncate">{f.name}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 text-sm leading-none transition-opacity"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {/* Create new */}
                    <div className="space-y-1.5 bg-(--surface) border border-(--border-color) rounded p-2">
                        <input
                            type="text"
                            placeholder="Name (e.g. Profit)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-transparent border border-(--border-color) rounded px-2 py-1 font-mono text-[10px] text-(--foreground) placeholder:text-(--brand-secondary)/50 outline-none focus:border-(--brand-primary)"
                        />
                        <input
                            type="text"
                            placeholder="Expression (e.g. Revenue - Cost)"
                            value={expression}
                            onChange={(e) => setExpression(e.target.value)}
                            className="w-full bg-transparent border border-(--border-color) rounded px-2 py-1 font-mono text-[10px] text-(--foreground) placeholder:text-(--brand-secondary)/50 outline-none focus:border-(--brand-primary)"
                        />
                        {/* Column reference hints */}
                        <div className="flex flex-wrap gap-1">
                            {columns.slice(0, 6).map(col => (
                                <button
                                    key={col}
                                    onClick={() => setExpression(prev => prev + `"${col}"`)}
                                    className="text-[8px] font-mono bg-(--surface-hover) text-(--brand-secondary) px-1 py-0.5 rounded hover:text-(--foreground) transition-colors border border-(--border-color)"
                                    title={`Insert "${col}"`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleCreate}
                            className="w-full bg-purple-600 text-white font-mono text-[9px] py-1 rounded hover:bg-purple-700 transition-colors uppercase tracking-wider"
                        >
                            + Create Field
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
