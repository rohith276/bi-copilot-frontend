"use client";

import React, { useState } from 'react';
import CopilotTab from './explorer/CopilotTab';
import { apiFetch } from '@/lib/api';
import { useToast } from './Toast';

export default function AskAIExplorer({ datasetId }: { datasetId: number }) {
    const [nlQuery, setNlQuery] = useState('');
    const [nlLoading, setNlLoading] = useState(false);
    const [nlResponse, setNlResponse] = useState<any>(null);
    const { addToast } = useToast();

    const suggestions = [
        "Show me the top 5 records with highest values",
        "What is the average of the numeric columns?",
        "Are there any notable trends in the data?",
        "Summarize the main characteristics of this dataset"
    ];

    const handleNLQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nlQuery.trim()) return;

        setNlLoading(true);
        setNlResponse(null);

        try {
            const result = await apiFetch(`/datasets/${datasetId}/nl-query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: nlQuery }),
            });
            setNlResponse(result);
            addToast("AI query processed successfully", "success");
        } catch (error: any) {
            addToast(error.message || "Failed to process query", "error");
        } finally {
            setNlLoading(false);
        }
    };

    return (
        <div className="h-full pt-4">
            <CopilotTab 
                datasetId={datasetId}
                nlQuery={nlQuery}
                setNlQuery={setNlQuery}
                handleNLQuery={handleNLQuery}
                nlLoading={nlLoading}
                suggestions={suggestions}
                nlResponse={nlResponse}
            />
        </div>
    );
}
