"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardBase() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to the root dash or first available dataset
        // For now, redirect back to home if accessed directly without ID
        router.replace('/');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-full mb-4"></div>
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Routing Workspace...</p>
            </div>
        </div>
    );
}
