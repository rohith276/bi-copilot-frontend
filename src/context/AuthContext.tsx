"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    email: string;
    username?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearStoredSession() {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem('bi_token');
    localStorage.removeItem('bi_user');
}

function decodeJwtPayload(token: string): { exp?: number } | null {
    try {
        const payload = token.split('.')[1];
        if (!payload) {
            return null;
        }

        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

function getStoredSession(): { token: string | null; user: User | null } {
    if (typeof window === 'undefined') {
        return { token: null, user: null };
    }

    const savedToken = localStorage.getItem('bi_token');
    const savedUser = localStorage.getItem('bi_user');
    if (!savedToken || !savedUser) {
        return { token: null, user: null };
    }

    const payload = decodeJwtPayload(savedToken);
    if (!payload?.exp || Date.now() >= payload.exp * 1000) {
        clearStoredSession();
        return { token: null, user: null };
    }

    try {
        return {
            token: savedToken,
            user: JSON.parse(savedUser) as User,
        };
    } catch {
        clearStoredSession();
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const initialSession = getStoredSession();
    const [user, setUser] = useState<User | null>(initialSession.user);
    const [token, setToken] = useState<string | null>(initialSession.token);
    const router = useRouter();

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('bi_token', newToken);
        localStorage.setItem('bi_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        clearStoredSession();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
