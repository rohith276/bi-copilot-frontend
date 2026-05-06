const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_BASE_URL = DEFAULT_API_BASE_URL;

export function getApiBaseUrl() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('bi_api_url') || DEFAULT_API_BASE_URL;
    }
    return DEFAULT_API_BASE_URL;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Add token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('bi_token') : null;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            let errorMessage = `API error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                // Ignore parsing errors
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                throw new Error('Connection to intelligence engine lost. Please ensure backend is running.');
            }
            throw error;
        }
        throw new Error('An unexpected network error occurred.');
    }
}
