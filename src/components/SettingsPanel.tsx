"use client";

import React, { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { useToast } from "./Toast";
import { useTheme } from "./ThemeContext";
import { PaperTape, TechnicalBadge } from "./PaperAccents";

export default function SettingsPanel() {
    const { addToast } = useToast();
    const { theme, toggleTheme } = useTheme();
    const [subTab, setSubTab] = useState<'general' | 'developer'>('general');
    const [openaiKey, setOpenaiKey] = useState(
        typeof window !== "undefined" ? localStorage.getItem("bi_openai_key") || "" : ""
    );
    const [saved, setSaved] = useState(false);
    const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
    const [apiUrl, setApiUrl] = useState(
        typeof window !== "undefined" ? getApiBaseUrl() : "http://localhost:8000"
    );

    const checkBackend = async (targetUrl: string = apiUrl) => {
        try {
            setBackendStatus("checking");
            const response = await fetch(`${targetUrl.replace(/\/$/, "")}/`);
            if (!response.ok) {
                throw new Error("Backend health check failed");
            }
            setBackendStatus("online");
        } catch {
            setBackendStatus("offline");
        }
    };

    useEffect(() => {
        void checkBackend(apiUrl);
    }, [apiUrl]);

    const saveSettings = () => {
        localStorage.setItem("bi_openai_key", openaiKey);
        localStorage.setItem("bi_api_url", apiUrl);
        setSaved(true);
        addToast("Settings saved successfully", "success");
        setTimeout(() => setSaved(false), 2000);
        void checkBackend(apiUrl);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Header & Sub-Tab Navigation */}
            <div className="border-b border-(--border-color) pb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-(--foreground) uppercase tracking-wider">WORKSPACE SETTINGS</h2>
                    <p className="text-xs text-(--brand-secondary) mt-0.5">Configure API credentials, preferred AI models, and interface options.</p>
                </div>
                <div className="flex bg-(--surface-hover) border border-(--border-color) rounded p-0.5 gap-0.5">
                    <button
                        onClick={() => setSubTab('general')}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                            subTab === 'general' ? 'bg-(--brand-primary) text-white' : 'text-(--brand-secondary) hover:text-(--foreground)'
                        }`}
                    >
                        General Workspace
                    </button>
                    <button
                        onClick={() => setSubTab('developer')}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                            subTab === 'developer' ? 'bg-(--brand-primary) text-white' : 'text-(--brand-secondary) hover:text-(--foreground)'
                        }`}
                    >
                        Developer Diagnostics
                    </button>
                </div>
            </div>

            {subTab === 'general' && (
                <div className="space-y-5">
                    {/* Appearance Mode */}
                    <div className="paper-sheet p-5 relative overflow-hidden">
                        <PaperTape className="right-4 top-2 rotate-2" />
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-xs text-(--foreground) uppercase tracking-wider">INTERFACE THEME</h3>
                                <p className="text-xs text-(--brand-secondary) mt-0.5">Switch between Light Paper and Dark Blueprint workspace themes</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="paper-button paper-button-secondary text-xs"
                            >
                                Theme: {theme === "light" ? "Light Paper ☀️" : "Dark Blueprint 🌙"}
                            </button>
                        </div>
                    </div>

                    {/* AI Engine Credentials */}
                    <div className="paper-sheet p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-xs text-(--foreground) uppercase tracking-wider">AI COPILOT CREDENTIALS</h3>
                            <TechnicalBadge text="GPT-4o-mini" status="blueprint" />
                        </div>
                        <p className="text-xs text-(--brand-secondary)">
                            Provide your OpenAI or OpenRouter key to enable natural language SQL queries and automated business insight generation.
                        </p>
                        <div>
                            <label className="text-[10px] font-bold text-(--brand-secondary) uppercase block mb-1">OpenAI / OpenRouter API Key</label>
                            <input
                                type="password"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                className="paper-input w-full font-mono text-xs"
                                placeholder="sk-..."
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={saveSettings}
                        className="paper-button paper-button-primary w-full py-2.5 text-xs font-semibold uppercase tracking-wider"
                    >
                        {saved ? "✓ Workspace Settings Saved" : "Save Workspace Settings →"}
                    </button>
                </div>
            )}

            {subTab === 'developer' && (
                <div className="space-y-5 font-mono text-xs">
                    {/* Backend Engine Health */}
                    <div className="paper-sheet p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-xs text-(--foreground) uppercase">BACKEND TELEMETRY STATUS</h3>
                            <button
                                onClick={() => void checkBackend(apiUrl)}
                                className="text-[10px] font-bold text-(--brand-primary) uppercase hover:underline"
                            >
                                Re-ping Server
                            </button>
                        </div>
                        <div className="flex items-center gap-3 bg-(--surface-hover) p-3 rounded border border-(--border-color)">
                            <div className={`w-2.5 h-2.5 rounded-full ${backendStatus === "online" ? "bg-emerald-500 shadow-[0_0_8px_#34d399]" : backendStatus === "offline" ? "bg-rose-500" : "bg-amber-500 animate-pulse"}`} />
                            <span className="font-bold text-(--foreground) uppercase">{backendStatus}</span>
                            <span className="text-(--brand-secondary) ml-auto">{apiUrl}</span>
                        </div>
                    </div>

                    {/* API Routing */}
                    <div className="paper-sheet p-5 space-y-3">
                        <h3 className="font-bold text-xs text-(--foreground) uppercase">FASTAPI ENDPOINT ROUTING</h3>
                        <div>
                            <label className="text-[10px] font-bold text-(--brand-secondary) uppercase block mb-1">Target Endpoint URL</label>
                            <input
                                type="text"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                className="paper-input w-full text-xs font-mono"
                                placeholder="http://localhost:8000"
                            />
                        </div>
                    </div>

                    {/* Architecture Stack */}
                    <div className="paper-sheet p-5">
                        <h3 className="font-bold text-xs text-(--foreground) uppercase mb-3 border-b border-(--border-color) pb-2">ARCHITECTURE STACK SPEC</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Frontend Core", value: "Next.js 16 + React 19" },
                                { label: "Backend Core", value: "FastAPI + Python 3.12" },
                                { label: "AI LLM Engine", value: "OpenAI GPT-4o-mini" },
                                { label: "ML Analytics", value: "Scikit-learn + Statsmodels" },
                                { label: "Database", value: "SQLite + SQLAlchemy" },
                                { label: "Visualization", value: "Chart.js Wrapper" },
                            ].map((item) => (
                                <div key={item.label} className="bg-(--surface-hover) rounded p-2.5 border border-(--border-color)">
                                    <p className="text-[10px] font-bold text-(--brand-secondary) uppercase mb-0.5">{item.label}</p>
                                    <p className="font-bold text-(--foreground) text-xs">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
