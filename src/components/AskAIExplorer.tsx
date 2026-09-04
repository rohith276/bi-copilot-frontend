"use client";

import React, { useState } from 'react';
import CopilotTab from './explorer/CopilotTab';
import { apiFetch } from '@/lib/api';
import { useToast } from './Toast';

interface ConversationTurn {
    question: string;
    sql: string;
    insight: string;
}

const ROOT_CAUSE_PATTERN = /\b(why|what caused|reason for|root cause|explain.*drop|explain.*decline|explain.*decrease)\b/i;

export default function AskAIExplorer({ datasetId }: { datasetId: number }) {
    const [nlQuery, setNlQuery] = useState('');
    const [nlLoading, setNlLoading] = useState(false);
    const [nlResponse, setNlResponse] = useState<any>(null);
    const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
    const { addToast } = useToast();

    const suggestions = [
        "Why did sales drop in the recent period?",
        "Show me the top 5 records with highest values",
        "What is the average of the numeric columns?",
        "Break down revenue by category",
    ];

    const handleNLQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nlQuery.trim()) return;

        setNlLoading(true);
        setNlResponse(null);

        try {
            const isRootCause = ROOT_CAUSE_PATTERN.test(nlQuery);

            if (isRootCause) {
                const result = await apiFetch(`/analytics/${datasetId}/root-cause`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question: nlQuery }),
                });

                const breakdownChart = result.breakdowns?.[0]?.top_movers || [];
                setNlResponse({
                    insights: result.narrative,
                    sql_query: `-- Root-cause analysis: ${result.metric}\n-- Period: ${result.period_label}\n-- Prior: ${result.prior_total} → Recent: ${result.recent_total} (Δ ${result.delta_pct}%)`,
                    chart_config: result.chart_config,
                    result: {
                        columns: ["segment", "prior", "recent", "delta"],
                        data: breakdownChart,
                        total_rows: breakdownChart.length,
                    },
                    rootCause: result,
                });
            } else {
                const result = await apiFetch(`/datasets/${datasetId}/nl-query`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: nlQuery,
                        conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
                    }),
                });
                setNlResponse(result);

                setConversationHistory(prev => [...prev, {
                    question: nlQuery,
                    sql: result.sql_query,
                    insight: result.insights,
                }]);
            }

            addToast(isRootCause ? "Root-cause analysis complete" : "AI query processed successfully", "success");
        } catch (error: any) {
            addToast(error.message || "Failed to process query", "error");
        } finally {
            setNlLoading(false);
        }
    };

    const handleClearConversation = () => {
        setConversationHistory([]);
        setNlResponse(null);
        setNlQuery('');
    };

    return (
        <div className="h-full pt-4">
            {conversationHistory.length > 0 && (
                <div className="flex items-center gap-2 mb-2 px-4">
                    <span className="font-mono text-[10px] text-(--brand-primary) bg-(--brand-primary)/10 px-2 py-1 rounded font-bold uppercase">
                        💬 {conversationHistory.length} turn{conversationHistory.length > 1 ? 's' : ''} in context
                    </span>
                    <button
                        onClick={handleClearConversation}
                        className="font-mono text-[10px] text-rose-500 hover:text-rose-400 font-bold uppercase hover:underline"
                    >
                        Reset Conversation
                    </button>
                </div>
            )}
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
