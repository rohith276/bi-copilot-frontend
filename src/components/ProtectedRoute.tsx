"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedToken = localStorage.getItem('bi_token');

        if (!isAuthenticated && !savedToken) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // Prevent hydration mismatch: render nothing (matching server) until the client has mounted
    if (!mounted) {
        return null;
    }

    const isAuthenticating = !isAuthenticated && localStorage.getItem('bi_token');

    if (!isAuthenticated && !isAuthenticating) {
        return null;
    }

    return <>{children}</>;
}
