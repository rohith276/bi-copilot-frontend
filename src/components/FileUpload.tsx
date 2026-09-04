"use client";

import React, { useState } from 'react';
import { useToast } from './Toast';
import { getApiBaseUrl, apiFetch } from '@/lib/api';
import { TechnicalBadge, PaperTape } from './PaperAccents';

const MAX_UPLOAD_SIZE_MB = 10;

export default function FileUpload() {
  const [activeTab, setActiveTab] = useState<'file' | 'database'>('file');
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // DB state
  const [dbName, setDbName] = useState('');
  const [dbConnectionString, setDbConnectionString] = useState('');
  const [dbQuery, setDbQuery] = useState('SELECT * FROM ');
  
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        addToast(`File too large (Max ${MAX_UPLOAD_SIZE_MB}MB)`, 'error');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (activeTab === 'file' && !file) return;
    if (activeTab === 'database' && (!dbName || !dbConnectionString || !dbQuery)) {
      addToast('Please fill all database fields', 'error');
      return;
    }

    setUploading(true);

    try {
      let response;
      if (activeTab === 'file') {
        const formData = new FormData();
        formData.append('file', file as File);
        response = await apiFetch(`/datasets/upload`, {
          method: 'POST',
          body: formData,
          headers: {} 
        });
      } else {
        response = await apiFetch(`/datasets/connect-db`, {
          method: 'POST',
          body: JSON.stringify({
            name: dbName,
            connection_string: dbConnectionString,
            query: dbQuery
          })
        });
      }

      if (response) {
        addToast(`Successfully ingested dataset`, 'success');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setDbName('');
        window.dispatchEvent(new Event('bi:datasets-changed'));
      } else {
        addToast('Ingestion failed', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Connection failed. Verify backend is running and credentials are correct.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="paper-sheet p-4 h-full flex flex-col justify-between relative overflow-hidden">
      <PaperTape className="left-3 -top-1 -rotate-3" />
      
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-mono font-bold text-(--foreground) uppercase tracking-wider flex gap-3">
          <button 
            className={`transition-colors ${activeTab === 'file' ? 'text-(--brand-primary) border-b-2 border-(--brand-primary)' : 'text-(--brand-secondary) hover:text-(--foreground)'}`}
            onClick={() => setActiveTab('file')}
          >
            FILE UPLOAD
          </button>
          <button 
            className={`transition-colors ${activeTab === 'database' ? 'text-(--brand-primary) border-b-2 border-(--brand-primary)' : 'text-(--brand-secondary) hover:text-(--foreground)'}`}
            onClick={() => setActiveTab('database')}
          >
            DATABASE
          </button>
        </h2>
        {activeTab === 'file' && <TechnicalBadge text={`MAX ${MAX_UPLOAD_SIZE_MB}MB`} status="neutral" />}
      </div>

      <div className="flex-1 flex flex-col justify-center my-1">
        {activeTab === 'file' ? (
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded cursor-pointer transition-colors ${
              file ? 'bg-(--surface-hover) border-(--brand-primary)' : 'bg-(--surface) border-(--border-color) hover:bg-(--surface-hover)'
            }`}>
            
            <div className="flex flex-col items-center justify-center p-3 text-center">
              <svg className={`w-6 h-6 mb-1.5 ${file ? 'text-(--brand-primary)' : 'text-(--brand-secondary)'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <p className="text-xs font-mono font-bold text-(--foreground)">
                {file ? file.name : "Select CSV / Excel dataset file"}
              </p>
              {!file && <p className="text-[10px] font-mono text-(--brand-secondary) mt-0.5">Supports .csv, .xlsx, .json, .jsonl, .parquet</p>}
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".csv,.xlsx,.xls,.json,.jsonl,.parquet" />
          </label>
        ) : (
          <div className="flex flex-col gap-2 h-32 overflow-y-auto pr-1 custom-scrollbar">
            <input 
              type="text" 
              placeholder="Dataset Name (e.g. Q3 Sales)" 
              value={dbName}
              onChange={e => setDbName(e.target.value)}
              className="w-full bg-(--surface) border border-(--border-color) rounded p-1.5 text-xs font-mono text-(--foreground) focus:border-(--brand-primary) outline-none"
            />
            <input 
              type="text" 
              placeholder="sqlite:///my_db.db OR postgresql://user:pass@host/db" 
              value={dbConnectionString}
              onChange={e => setDbConnectionString(e.target.value)}
              className="w-full bg-(--surface) border border-(--border-color) rounded p-1.5 text-xs font-mono text-(--foreground) focus:border-(--brand-primary) outline-none"
            />
            <textarea 
              placeholder="SELECT * FROM table" 
              value={dbQuery}
              onChange={e => setDbQuery(e.target.value)}
              className="w-full bg-(--surface) border border-(--border-color) rounded p-1.5 text-[10px] font-mono text-brand-primary focus:border-(--brand-primary) outline-none flex-1 resize-none min-h-10"
            />
          </div>
        )}

        {uploading && (
          <div className="mt-3 font-mono">
            <div className="flex justify-between text-[10px] text-(--brand-secondary) mb-1">
              <span>Ingesting & AI-Cleaning Dataset...</span>
              <svg className="animate-spin w-3.5 h-3.5 text-(--brand-primary)" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="w-full bg-(--surface-hover) rounded-full h-1.5 overflow-hidden border border-(--border-color)">
              <div
                className="bg-(--brand-primary) h-full animate-pulse"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={(activeTab === 'file' ? !file : (!dbName || !dbConnectionString || !dbQuery)) || uploading}
          className="paper-button paper-button-primary w-full mt-3 text-xs font-mono uppercase tracking-wider shrink-0"
        >
          {uploading ? (
            'Ingesting Dataset...'
          ) : (
            'Extract & Analyze Data →'
          )}
        </button>
      </div>
    </div>
  );
}
