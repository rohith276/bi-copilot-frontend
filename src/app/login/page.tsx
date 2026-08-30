"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl, setAuthToken } from "@/lib/api";
import { PaperTape, TechnicalBadge } from "@/components/PaperAccents";
import GraphPaperBackground from "@/components/GraphPaperBackground";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const baseUrl = getApiBaseUrl();

            if (mode === "register") {
                // Register first, then auto-login
                const regRes = await fetch(`${baseUrl}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, username: username || undefined, password }),
                });
                if (!regRes.ok) {
                    const data = await regRes.json().catch(() => ({}));
                    throw new Error(data.detail || "Registration failed");
                }
            }

            // Login
            const loginRes = await fetch(`${baseUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!loginRes.ok) {
                const data = await loginRes.json().catch(() => ({}));
                throw new Error(data.detail || "Login failed");
            }

            const { access_token } = await loginRes.json();
            setAuthToken(access_token);
            router.push("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <GraphPaperBackground />

            <div className="paper-sheet p-8 w-full max-w-md relative z-10">
                <PaperTape className="-left-2 top-3 -rotate-3" />

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-(--brand-primary) text-white font-mono font-bold text-sm flex items-center justify-center rounded">
                            BI
                        </div>
                        <h1 className="font-mono text-lg font-bold text-(--foreground) uppercase tracking-widest">
                            BI Copilot
                        </h1>
                    </div>
                    <p className="text-xs font-mono text-(--brand-secondary) uppercase tracking-wider">
                        Data Intelligence Engine — Authentication Gate
                    </p>
                </div>

                {/* Tab Toggle */}
                <div className="flex border border-(--border-color) rounded overflow-hidden mb-6">
                    <button
                        onClick={() => { setMode("login"); setError(""); }}
                        className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                            mode === "login"
                                ? "bg-(--brand-primary) text-white"
                                : "bg-(--surface-hover) text-(--brand-secondary) hover:text-(--foreground)"
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode("register"); setError(""); }}
                        className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                            mode === "register"
                                ? "bg-(--brand-primary) text-white"
                                : "bg-(--surface-hover) text-(--brand-secondary) hover:text-(--foreground)"
                        }`}
                    >
                        Register
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded text-xs font-mono text-rose-600 dark:text-rose-400">
                        ⚠ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-mono font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="operator@company.com"
                            required
                            className="paper-input w-full text-xs font-mono"
                        />
                    </div>

                    {mode === "register" && (
                        <div>
                            <label className="block text-[10px] font-mono font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                                Username (optional)
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="operator"
                                className="paper-input w-full text-xs font-mono"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-mono font-bold text-(--brand-secondary) uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={8}
                            className="paper-input w-full text-xs font-mono"
                        />
                        {mode === "register" && (
                            <p className="mt-1 text-[10px] font-mono text-(--brand-secondary)">
                                Minimum 8 characters required
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="paper-button paper-button-primary w-full text-xs font-mono uppercase tracking-wider py-2.5"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Authenticating...
                            </span>
                        ) : mode === "login" ? (
                            "Access Intelligence Engine →"
                        ) : (
                            "Create Operator Account →"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-(--border-color) flex items-center justify-between">
                    <TechnicalBadge text="AES-256" status="success" />
                    <span className="text-[10px] font-mono text-(--brand-secondary)">
                        JWT Bearer Authentication
                    </span>
                </div>
            </div>
        </div>
    );
}
