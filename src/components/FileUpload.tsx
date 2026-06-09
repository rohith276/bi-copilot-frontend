"use client";

import React, { useState } from 'react';
import { useToast } from './Toast';
import { getApiBaseUrl } from '@/lib/api';

const MAX_UPLOAD_SIZE_MB = 10;

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        addToast(`File too large (Max ${MAX_UPLOAD_SIZE_MB}MB)`, 'error');
        return;
      }
      setFile(selectedFile);
      addToast(`Selected ${selectedFile.name}`, 'info');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10); // Start progress

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 100);

    try {
      const response = await fetch(`${getApiBaseUrl()}/datasets/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        addToast(`Successfully processed ${data.filename}`, 'success');
        setFile(null);
        window.dispatchEvent(new Event('bi:datasets-changed'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        addToast(errorData.detail || 'The processing engine rejected this file', 'error');
      }
    } catch {
      addToast('Engine connection timed out. Verify backend is running.', 'error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div className="p-8 bg-surface-100 rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl border border-white/10 overflow-hidden relative group">
      {/* Decorative background element */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

      <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Vector Intake</h2>
      <p className="text-xs text-slate-400 mb-6 font-medium">Feed the engine raw CSV or Excel data</p>

      <div className="flex flex-col gap-4 relative z-10">
        <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${file ? 'bg-indigo-500/5 border-indigo-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-all duration-500 ${file ? 'bg-indigo-600 text-white rotate-[360deg]' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'
              }`}>
              {file ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              )}
            </div>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-300"><span className="font-bold">Click to select or drag file here</span></p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Supports .csv, .xlsx ({MAX_UPLOAD_SIZE_MB}MB MAX)</p>
          </div>
          <input type="file" className="hidden" onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
        </label>

        {file && !uploading && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center justify-between group/file animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
            </div>
            <button onClick={() => setFile(null)} className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}

        {uploading && (
          <div className="space-y-2 animate-in fade-in">
            <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase tracking-widest">
              <span>Cleaning & Processing</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all duration-500 ${!file || uploading
            ? 'bg-slate-200 cursor-not-allowed text-slate-400'
            : 'bg-slate-900 hover:bg-indigo-600 active:scale-[0.98] shadow-lg hover:shadow-indigo-200'
            }`}
        >
          {uploading ? 'Processing Data...' : 'Engage Sync'}
        </button>
      </div>
    </div>
  );
}
