"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function FloatingCopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
        { role: "ai", text: "Hello! I'm your BI Copilot. How can I help you analyze your business data today?" }
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
            // General query (no specific dataset id in context for global bubble)
            // The backend NLQ might need a 'global' mode or just use the first dataset.
            // For now, we'll try to find any dataset to answer if one exists.
            const datasets = await apiFetch("/datasets/");
            let result;
            if (datasets.length > 0) {
                result = await apiFetch(`/datasets/${datasets[0].id}/nl-query`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: userMsg }),
                });
            } else {
                throw new Error("No datasets uploaded yet. Please upload a file first!");
            }

            setMessages((prev) => [...prev, { role: "ai", text: result.insights || "I found some data for you. Check the dashboard for details!" }]);
        } catch (err: any) {
            setMessages((prev) => [...prev, { role: "ai", text: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-10 right-10 z-[500] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-6 w-96 max-h-[550px] bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border border-white/20 dark:border-white/5 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest">BI Copilot</h3>
                                <p className="text-[10px] font-bold opacity-70">Always Active AI</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 min-h-[300px]">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                                    m.role === "user" 
                                    ? "bg-indigo-600 text-white rounded-tr-none" 
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 rounded-tl-none"
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5 flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about your data..."
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7v14z" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-20 h-20 rounded-[28px] shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex items-center justify-center text-4xl transition-all duration-500 hover:scale-110 active:scale-90 ${
                    isOpen ? "bg-slate-900 text-white rotate-[360deg]" : "bg-gradient-to-br from-indigo-600 to-purple-700 text-white"
                }`}
            >
                {isOpen ? "✕" : "🤖"}
            </button>
        </div>
    );
}
