"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { TechnicalBadge } from "./PaperAccents";

export default function FloatingCopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
        { role: "ai", text: "Hello! I am your AI Copilot assistant. Ask me any question about your active dataset." }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim() || loading) return;

        const userMsg = query;
        setQuery("");
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setLoading(true);

        try {
            let targetDatasetId: number | null = null;
            if (typeof window !== "undefined") {
                const match = window.location.pathname.match(/\/(?:explore|dashboard)\/(\d+)/);
                if (match) {
                    targetDatasetId = parseInt(match[1], 10);
                }
            }

            const datasets = await apiFetch("/datasets/");
            if (datasets.length === 0) {
                throw new Error("No datasets uploaded yet. Please upload a CSV/Excel file first!");
            }

            const activeId = targetDatasetId || datasets[0].id;
            const result = await apiFetch(`/datasets/${activeId}/nl-query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: userMsg }),
            });

            setMessages((prev) => [...prev, { role: "ai", text: result.insights || "I analyzed your dataset and processed the query." }]);
        } catch (err: any) {
            setMessages((prev) => [...prev, { role: "ai", text: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-500 flex flex-col items-end">
            {/* Assistant Drawer */}
            {isOpen && (
                <div className="mb-3 w-96 max-h-125 saas-card overflow-hidden flex flex-col shadow-lg border border-(--border-color)">
                    {/* Header */}
                    <div className="p-3 bg-(--surface-hover) border-b border-(--border-color) flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-(--brand-primary) text-white rounded font-bold text-xs flex items-center justify-center">AI</div>
                            <div>
                                <h3 className="font-semibold text-xs text-(--foreground)">BI COPILOT ASSISTANT</h3>
                                <p className="text-[10px] text-(--brand-secondary) font-mono">Dataset Context Assistant</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-(--brand-secondary) hover:text-(--foreground) font-bold text-xs">
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
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

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-2.5 bg-(--surface-hover) border-t border-(--border-color) flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask a question..."
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

            {/* Trigger Button */}
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
