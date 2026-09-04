"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { TechnicalBadge } from '@/components/PaperAccents';

interface Collaborator {
    id: number;
    dataset_id: number;
    shared_with_email: string;
    permission: string;
}

interface ShareDialogProps {
    datasetId: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareDialog({ datasetId, isOpen, onClose }: ShareDialogProps) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'view' | 'edit'>('view');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const loadCollaborators = async () => {
        try {
            const data = await apiFetch(`/datasets/${datasetId}/collaborators`);
            setCollaborators(data);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        if (isOpen) loadCollaborators();
    }, [isOpen, datasetId]);

    const handleShare = async () => {
        if (!email.trim()) {
            addToast('Email is required', 'error');
            return;
        }
        setLoading(true);
        try {
            await apiFetch(`/datasets/${datasetId}/collaborators`, {
                method: 'POST',
                body: JSON.stringify({ email: email.trim(), permission }),
            });
            setEmail('');
            addToast(`Shared with ${email}`, 'success');
            await loadCollaborators();
        } catch (e) {
            addToast(`Failed to share: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (shareId: number, shareEmail: string) => {
        try {
            await apiFetch(`/datasets/${datasetId}/collaborators/${shareId}`, {
                method: 'DELETE',
            });
            addToast(`Revoked access for ${shareEmail}`, 'success');
            await loadCollaborators();
        } catch {
            addToast('Failed to revoke access', 'error');
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4 backdrop-blur-xs" onClick={onClose}>
            <div className="paper-sheet p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-mono font-bold text-sm text-(--foreground) uppercase tracking-widest">
                            Share Dataset
                        </h2>
                        <p className="font-mono text-[10px] text-(--brand-secondary) mt-0.5">
                            Invite collaborators by email
                        </p>
                    </div>
                    <button onClick={onClose} className="text-(--brand-secondary) hover:text-(--foreground) text-xl leading-none">×</button>
                </div>

                {/* Share Form */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleShare()}
                        className="flex-1 bg-transparent border border-(--border-color) rounded px-3 py-2 font-mono text-xs text-(--foreground) placeholder:text-(--brand-secondary)/50 outline-none focus:border-(--brand-primary) transition-colors"
                    />
                    <select
                        value={permission}
                        onChange={e => setPermission(e.target.value as 'view' | 'edit')}
                        className="saas-input font-mono text-xs w-24"
                    >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                    </select>
                    <button
                        onClick={handleShare}
                        disabled={loading}
                        className="saas-button saas-button-primary font-mono text-xs uppercase tracking-wider px-4"
                    >
                        {loading ? '...' : 'Share'}
                    </button>
                </div>

                {/* Collaborators List */}
                <div className="space-y-2">
                    <h3 className="font-mono text-[10px] text-(--brand-secondary) uppercase tracking-wider font-bold border-b border-(--border-color) pb-1">
                        Current Access ({collaborators.length})
                    </h3>
                    {collaborators.length === 0 ? (
                        <p className="font-mono text-[10px] text-(--brand-secondary) py-3 text-center">
                            No collaborators yet. Share this dataset to get started.
                        </p>
                    ) : (
                        collaborators.map(c => (
                            <div key={c.id} className="flex items-center justify-between bg-(--surface-hover) border border-(--border-color) rounded px-3 py-2 group">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-(--brand-primary)/20 flex items-center justify-center font-mono text-[10px] font-bold text-(--brand-primary)">
                                        {c.shared_with_email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-mono text-xs text-(--foreground) font-bold">{c.shared_with_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TechnicalBadge 
                                        text={c.permission.toUpperCase()} 
                                        status={c.permission === 'edit' ? 'success' : 'neutral'} 
                                    />
                                    <button
                                        onClick={() => handleRevoke(c.id, c.shared_with_email)}
                                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 font-mono text-[9px] uppercase transition-opacity"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
