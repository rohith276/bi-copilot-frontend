"use client";

import React, { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { useToast } from "./Toast";
import { useTheme } from "./ThemeContext";

export default function SettingsPanel() {
    const { addToast } = useToast();
    const { theme, toggleTheme } = useTheme();
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
        addToast("Settings saved locally", "success");
        setTimeout(() => setSaved(false), 2000);
        void checkBackend(apiUrl);
    };

    const statusColor = {
        checking: "bg-amber-400",
        online: "bg-emerald-500",
        offline: "bg-red-500",
    }[backendStatus];

    const statusLabel = {
        checking: "Checking...",
        online: "Online",
        offline: "Offline",
    }[backendStatus];

    return (
        <div className="max-w-2xl mx-auto py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Settings</h2>
                <p className="text-slate-400 text-sm font-medium">Configure your BI Copilot instance.</p>
            </div>

            <div className="bg-surface-100 rounded-[28px] p-6 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-sm text-foreground uppercase tracking-widest">Appearance</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Switch between light and dark themes</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-indigo-500 transition-all shadow-sm"
                    >
                        <span>{theme === "light" ? "Moon" : "Sun"}</span>
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </button>
                </div>
            </div>

            <div className="bg-surface-100 rounded-[28px] p-6 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-sm text-foreground uppercase tracking-widest">Backend Status</h3>
                    <button
                        onClick={() => void checkBackend(apiUrl)}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        Recheck
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColor} ${backendStatus === "checking" ? "animate-pulse" : ""}`} />
                    <span className="font-bold text-sm text-foreground">{statusLabel}</span>
                    <span className="text-sm text-slate-400 font-mono ml-2">{apiUrl}</span>
                </div>
            </div>

            <div className="bg-surface-100 rounded-[28px] p-6 border border-white/10 shadow-xl space-y-4">
                <h3 className="font-black text-sm text-foreground uppercase tracking-widest">API Configuration</h3>
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Backend API URL</label>
                    <input
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        placeholder="http://localhost:8000"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 ml-1">This is the FastAPI server URL. Change if running on a different port.</p>
                </div>
            </div>

            <div className="bg-surface-100 rounded-[28px] p-6 border border-white/10 shadow-xl space-y-4">
                <h3 className="font-black text-sm text-foreground uppercase tracking-widest">AI Copilot Key</h3>
                <p className="text-xs text-slate-500">Your OpenAI API key should live on the backend in the <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600">.env</code> file. This field is stored only in browser localStorage as a reminder.</p>
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">OpenAI API Key (Reference only)</label>
                    <input
                        type="password"
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        placeholder="sk-..."
                    />
                </div>
            </div>

            <button
                onClick={saveSettings}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${
                    saved
                        ? "bg-emerald-600 text-white shadow-emerald-200"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                }`}
            >
                {saved ? "Saved" : "Save Settings"}
            </button>

            <div className="bg-surface-100 rounded-[28px] p-6 border border-white/10 shadow-xl">
                <h3 className="font-black text-sm text-foreground uppercase tracking-widest mb-4">Tech Stack</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Frontend", value: "Next.js 16 + React" },
                        { label: "Backend", value: "FastAPI (Python)" },
                        { label: "AI Engine", value: "OpenAI GPT-4o-mini" },
                        { label: "ML Stack", value: "Scikit-learn + Statsmodels" },
                        { label: "Database", value: "SQLite (SQLAlchemy)" },
                        { label: "Charts", value: "Chart.js" },
                    ].map((item) => (
                        <div key={item.label} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-xs font-bold text-foreground">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
