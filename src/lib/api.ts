const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_BASE_URL = DEFAULT_API_BASE_URL;

export function getApiBaseUrl() {
    if (typeof window !== 'undefined') {
        const envUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // In production (non-localhost), use the configured env URL
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isLocalHost && envUrl && envUrl !== 'http://localhost:8000') {
            return envUrl;
        }
        
        return envUrl || DEFAULT_API_BASE_URL;
    }
    return DEFAULT_API_BASE_URL;
}


export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const clientOpenAIKey = typeof window !== 'undefined' ? localStorage.getItem('bi_openai_key') : null;
    
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(clientOpenAIKey ? { 'X-OpenAI-Key': clientOpenAIKey } : {}),
        ...(options.headers as Record<string, string>),
    };



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
