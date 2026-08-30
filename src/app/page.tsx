"use client";

import FileUpload from "@/components/FileUpload";
import DatasetList from "@/components/DatasetList";
import SettingsPanel from "@/components/SettingsPanel";
import HistoryPanel from "@/components/HistoryPanel";
import { TechnicalBadge, PaperTape } from "@/components/PaperAccents";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { apiFetch, getApiBaseUrl } from "@/lib/api";

import { Suspense } from "react";

function HomeContent() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'settings'>(
    (tabFromUrl === 'history' || tabFromUrl === 'settings') ? tabFromUrl : 'workspace'
  );
  const [engineStatus, setEngineStatus] = useState<"checking" | "online" | "offline">("checking");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalDatasets, setTotalDatasets] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl().replace(/\/$/, "")}/`);
        if (response.ok) {
          setEngineStatus("online");
        } else {
          setEngineStatus("offline");
        }
      } catch {
        setEngineStatus("offline");
      }
    };
    void checkStatus();
    
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const handleQuickSeed = async () => {
    setSeeding(true);
    try {
      await apiFetch('/datasets/seed', { method: 'POST' });
      addToast('Sample benchmark dataset generated successfully', 'success');
      window.dispatchEvent(new Event('bi:datasets-changed'));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to seed sample data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Quick action header since we removed the sidebar tabs */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-(--surface) p-1 rounded border border-(--border-color)">
               <button onClick={() => setActiveTab('workspace')} className={`px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${activeTab === 'workspace' ? 'bg-(--brand-primary) text-white shadow' : 'text-(--brand-secondary) hover:text-(--foreground)'}`}>CATALOG</button>
               <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${activeTab === 'history' ? 'bg-(--brand-primary) text-white shadow' : 'text-(--brand-secondary) hover:text-(--foreground)'}`}>EXECUTION LOGS</button>
               <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${activeTab === 'settings' ? 'bg-(--brand-primary) text-white shadow' : 'text-(--brand-secondary) hover:text-(--foreground)'}`}>CONFIG</button>
            </div>
            
            <button
                onClick={handleQuickSeed}
                disabled={seeding}
                className="paper-button paper-button-primary text-xs py-1.5 px-4 font-mono uppercase"
            >
                {seeding ? 'GENERATING...' : '⚡ Seed Sales Spec'}
            </button>
        </div>

        {activeTab === 'workspace' && (
          <>
            {/* File Intake & Metric Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1">
                <FileUpload />
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="paper-sheet p-4 flex flex-col justify-between relative overflow-hidden">
                    <PaperTape className="left-4 -top-1 -rotate-2" />
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-(--brand-secondary) uppercase">
                          REPOSITORY SPECS
                        </span>
                        <TechnicalBadge text="CATALOG" status="neutral" />
                      </div>
                      <h3 className="text-2xl font-mono font-bold text-(--foreground)">
                        {totalDatasets !== null ? totalDatasets : '---'}
                      </h3>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-(--border-color) flex items-center justify-between text-xs text-(--brand-secondary) font-mono">
                        <span>Ingested Data Files</span>
                        <span className="text-(--brand-primary) font-bold">Catalog Index</span>
                    </div>
                  </div>

                  <div className="paper-sheet p-4 flex flex-col justify-between relative overflow-hidden">
                    <PaperTape className="right-4 -top-1 rotate-2" />
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-(--brand-secondary) uppercase">
                          PIPELINE STATUS
                        </span>
                        <TechnicalBadge text={engineStatus === 'online' ? 'NOMINAL' : engineStatus === 'offline' ? 'OFFLINE' : 'CHECKING'} status={engineStatus === 'online' ? 'success' : 'neutral'} />
                      </div>
                      <h3 className="text-2xl font-mono font-bold text-(--foreground)">
                        {engineStatus === 'online' ? 'ONLINE' : engineStatus === 'offline' ? 'OFFLINE' : 'CHECKING...'}
                      </h3>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-(--border-color) flex items-center justify-between text-xs text-(--brand-secondary) font-mono">
                        <span>Pandas & DuckDB Active</span>
                        <span className={`font-bold ${engineStatus === 'online' ? 'text-emerald-600' : 'text-rose-500'}`}>{engineStatus === 'online' ? 'Operational' : 'Unavailable'}</span>
                    </div>
                  </div>

              </div>
            </div>

            {/* Main Dataset Ledger Table */}
            <div className="paper-sheet overflow-hidden">
              <div className="px-4 py-3 border-b border-(--border-color) bg-(--surface-hover) flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-(--foreground) uppercase tracking-wider">
                  DATASET CATALOG LEDGER
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search datasets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="paper-input text-xs font-mono py-1 px-3 pl-7 w-48"
                    />
                    <svg className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-(--brand-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <span className="text-[11px] font-mono text-(--brand-secondary)">
                    Repository Specs Ledger
                  </span>
                </div>
              </div>
              <div className="p-0">
                <DatasetList 
                  searchQuery={searchQuery} 
                  onDatasetsCountChange={(count) => setTotalDatasets(count)} 
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="paper-sheet p-6">
              <HistoryPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="paper-sheet p-6">
              <SettingsPanel />
          </div>
        )}

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6 text-(--brand-secondary) font-mono text-xs">Loading Workspace...</div>}>
      <HomeContent />
    </Suspense>
  );
}
