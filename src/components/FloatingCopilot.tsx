"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface ConversationTurn {
    question: string;
    sql: string;
    insight: string;
}

export default function FloatingCopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
        { role: "ai", text: "Hello! I am your AI Copilot assistant. Ask me any question about your active dataset — follow-ups work too." }
    ]);
    const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { isListening, isSupported, toggleListening } = useVoiceInput((transcript) => {
        setQuery(transcript);
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const resolveDatasetId = async (): Promise<number> => {
        if (typeof window !== "undefined") {
            const match = window.location.pathname.match(/\/(?:explore|dashboard)\/(\d+)/);
            if (match) return parseInt(match[1], 10);
        }
        const datasets = await apiFetch("/datasets/");
        if (datasets.length === 0) {
            throw new Error("No datasets uploaded yet. Please upload a CSV/Excel file first!");
        }
        return datasets[0].id;
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim() || loading) return;

        const userMsg = query;
        setQuery("");
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setLoading(true);

        try {
            const activeId = await resolveDatasetId();
            const result = await apiFetch(`/datasets/${activeId}/nl-query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: userMsg,
                    conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
                }),
            });

            setConversationHistory(prev => [...prev, {
                question: userMsg,
                sql: result.sql_query,
                insight: result.insights,
            }]);

            setMessages((prev) => [...prev, { role: "ai", text: result.insights || "I analyzed your dataset and processed the query." }]);
        } catch (err: any) {
            setMessages((prev) => [...prev, { role: "ai", text: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleResetConversation = () => {
        setConversationHistory([]);
        setMessages([{ role: "ai", text: "Conversation reset. Ask me a fresh question about your dataset." }]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-500 flex flex-col items-end">
            {isOpen && (
                <div className="mb-3 w-96 max-h-125 saas-card overflow-hidden flex flex-col shadow-lg border border-(--border-color)">
                    <div className="p-3 bg-(--surface-hover) border-b border-(--border-color) flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-(--brand-primary) text-white rounded font-bold text-xs flex items-center justify-center">AI</div>
                            <div>
                                <h3 className="font-semibold text-xs text-(--foreground)">BI COPILOT ASSISTANT</h3>
                                <p className="text-[10px] text-(--brand-secondary) font-mono">
                                    {conversationHistory.length > 0
                                        ? `${conversationHistory.length} turn${conversationHistory.length > 1 ? "s" : ""} in context`
                                        : "Dataset Context Assistant"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {conversationHistory.length > 0 && (
                                <button
                                    onClick={handleResetConversation}
                                    className="text-[10px] font-mono text-rose-500 hover:text-rose-400 font-bold uppercase"
                                >
                                    Reset
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-(--brand-secondary) hover:text-(--foreground) font-bold text-xs">
                                ✕
                            </button>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-(--surface) min-h-65 text-xs">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] p-2.5 rounded ${
                                    m.role === "user"
                                    ? "bg-(--brand-primary) text-white"
                                    : "bg-(--surface-hover) text-(--foreground) border border-(--border-color)"
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="p-2 bg-(--surface-hover) rounded border border-(--border-color) text-xs text-(--brand-secondary)">
                                    Processing Query...
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="p-2.5 bg-(--surface-hover) border-t border-(--border-color) flex gap-2">
                        {isSupported && (
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs ${
                                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-(--surface) border border-(--border-color) text-(--brand-secondary)'
                                }`}
                                title="Voice input"
                            >
                                🎤
                            </button>
                        )}
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={conversationHistory.length > 0 ? "Ask a follow-up..." : "Ask a question..."}
                            className="saas-input flex-1 text-xs"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="saas-button saas-button-primary text-xs px-3"
                        >
                            Ask
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center font-bold text-sm transition-colors ${
                    isOpen ? "bg-(--surface-hover) text-(--foreground) border border-(--border-color)" : "bg-(--brand-primary) text-white"
                }`}
            >
                {isOpen ? "✕" : "💬"}
            </button>
        </div>
    );
}
