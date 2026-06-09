"use client";

import FileUpload from "@/components/FileUpload";
import DatasetList from "@/components/DatasetList";
import SettingsPanel from "@/components/SettingsPanel";
import HistoryPanel from "@/components/HistoryPanel";
import { useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/api";

interface DatasetSummary {
  id: number;
  created_at?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'settings' | 'history'>('workspace');
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { addToast } = useToast();

  const handleLaunchModule = async (type: string) => {
    try {
      const datasets = (await apiFetch('/datasets/')) as DatasetSummary[];
      if (!datasets || datasets.length === 0) {
        addToast("Please upload or seed a dataset first to launch modules!", "error");
        return;
      }

      const latestDataset = [...datasets].sort((left, right) => {
        const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
        return rightTime - leftTime;
      })[0];
      const latestId = latestDataset.id;
      
      if (type === 'AI Intelligence' || type === 'Smart Actions' || type === 'Predictive Sales') {
        router.push(`/explore/${latestId}?view=analytics&module=${type}`);
      } else {
        router.push(`/explore/${latestId}?view=explore&module=${type}`);
      }
      
      addToast(`Launching ${type} for Dataset #${latestId}`, "success");
    } catch {
      addToast("Failed to launch module. Ensure backend is running.", "error");
    }
  };
  const tabs: Array<'workspace' | 'history' | 'settings'> = ['workspace', 'history', 'settings'];


  return (
    <>
      <main className="min-h-screen bg-background text-foreground selection:bg-indigo-100 font-sans pb-20 relative overflow-hidden transition-colors duration-500">
        {/* Dynamic Background Mesh */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${theme === 'light' ? 'bg-indigo-200/30' : 'bg-indigo-900/20'} rounded-full blur-[120px] animate-pulse`}></div>
          <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${theme === 'light' ? 'bg-purple-200/30' : 'bg-purple-900/20'} rounded-full blur-[120px] animate-pulse delay-700`}></div>
        </div>

        {/* Premium Glass Header */}
        <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-8 py-3.5 flex justify-between items-center animate-in slide-in-from-top duration-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-gradient"></div>
              <div className="relative w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110">
                <svg className="w-6 h-6 text-indigo-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <div>
              <span className={`text-xl font-black tracking-tight text-foreground transition-colors`}>BI COPILOT</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse glow-accent"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine Active</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="hidden lg:flex gap-1 bg-slate-200/20 dark:bg-slate-800/40 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab
                    ? 'bg-surface-100 text-indigo-600 dark:text-indigo-400 shadow-lg ring-1 ring-slate-200/50 scale-105'
                    : 'text-slate-500 hover:text-foreground dark:hover:text-white'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 bg-slate-200/20 dark:bg-slate-800/40 border border-white/10 rounded-xl hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all text-slate-500 shadow-sm flex items-center justify-center"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              )}
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              {/* User info removed */}
            </div>
          </div>
        </nav>

        {/* Main Content Workspace */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 py-10">

          {activeTab === 'workspace' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">
                    <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    Intelligence Core v1.4
                  </div>
                  <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight leading-[0.95] md:text-7xl transition-colors">
                    Scale your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient">intelligence.</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase flex items-center gap-3">
                    Autonomous Data Pipelines
                    <span className="w-12 h-[1px] bg-slate-200 dark:bg-slate-700"></span>
                    Real-time Vector Analysis
                  </p>
                </div>
                <div className="flex gap-4">
                  <button className="px-8 py-4 bg-slate-900 dark:bg-surface-100 dark:text-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all">
                    Get Started
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Left: Engine Control */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="glass-card rounded-3xl overflow-hidden">
                    <FileUpload />
                  </div>
                  <div className="p-8 bg-indigo-600 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Compute Units</h3>
                    <p className="text-sm font-bold opacity-80 mb-6">Real-time processing active across global distributed nodes.</p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black">ACTIVE</span>
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="w-[70%] h-full bg-white animate-pulse"></div>
                      </div>
                    </div>


                  </div>
                </div>

                {/* Right: Library */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="glass-card rounded-3xl overflow-hidden min-h-[400px]">
                    <DatasetList />
                  </div>
                  
                  {/* Live Intelligence Stream */}
                  <div className="bg-slate-900/90 dark:bg-black/40 backdrop-blur-3xl rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                           <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]">Intelligence Stream</h3>
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Feed Active</span>
                     </div>
                     <div className="space-y-4 font-mono text-[10px] text-slate-400">
                        <div className="flex gap-4 items-center opacity-80 group-hover:opacity-100 transition-opacity">
                           <span className="text-indigo-500/50">[0.00ms]</span>
                           <span className="text-white">SYNCHRONIZING VECTOR NODES...</span>
                           <span className="ml-auto text-emerald-500">COMPLETE</span>
                        </div>
                        <div className="flex gap-4 items-center opacity-60">
                           <span className="text-indigo-500/50">[1.24ms]</span>
                           <span>ANALYTIC SHARD ROTATION INITIATED</span>
                           <span className="ml-auto text-indigo-400">PENDING</span>
                        </div>
                        <div className="flex gap-4 items-center opacity-40">
                           <span className="text-indigo-500/50">[4.82ms]</span>
                           <span>RECONCILING DATA INTEGRITY PACKETS</span>
                           <span className="ml-auto text-slate-600">IDLE</span>
                        </div>
                     </div>
                     <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
                  </div>
                </div>
              </div>


              {/* Core Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    title: 'AI Intelligence', 
                    desc: 'Ask complex business questions in plain English.', 
                    icon: '🤖',
                    link: '#', 
                    tag: 'NLP Engine',
                    color: 'from-blue-600 to-indigo-700'
                  },
                  { 
                    title: 'Predictive Sales', 
                    desc: 'Forecast future growth with advanced ML models.', 
                    icon: '📈',
                    link: '#', 
                    tag: 'ML Core',
                    color: 'from-emerald-500 to-teal-600'
                  },
                  { 
                    title: 'Auto-Cleaning', 
                    desc: 'Zero-touch data standardization and repair.', 
                    icon: '✨',
                    link: '#', 
                    tag: 'Automated',
                    color: 'from-amber-500 to-orange-600'
                  },
                  { 
                    title: 'Smart Actions', 
                    desc: 'Get business-ready recommendations daily.', 
                    icon: '💡',
                    link: '#', 
                    tag: 'Intelligence',
                    color: 'from-purple-600 to-pink-600'
                  },
                ].map((feature, i) => (
                  <div key={i} className="group bg-surface-100 p-8 rounded-[36px] border border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden relative">
                     <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${feature.color}`}></div>
                     <div className="text-3xl mb-6 group-hover:scale-125 transition-transform duration-500">{feature.icon}</div>
                     <div className="mb-4">
                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded-md bg-gradient-to-r ${feature.color} text-white`}>
                          {feature.tag}
                        </span>
                     </div>
                     <h3 className="text-sm font-black text-foreground mb-2 uppercase tracking-tight">{feature.title}</h3>
                     <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                        {feature.desc}
                     </p>
                     <div 
                        onClick={() => handleLaunchModule(feature.title)}
                        className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:translate-x-2 transition-transform"
                     >
                        Launch Module
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                     </div>

                  </div>
                ))}
              </div>


            </div>
          ) : activeTab === 'history' ? (
            <div className="relative z-10 max-w-7xl mx-auto px-8">
              <HistoryPanel />
            </div>
          ) : (
            <div className="relative z-10 max-w-7xl mx-auto px-8">
              <SettingsPanel />
            </div>
          )}
        </div>

        <footer className="relative z-10 mt-20 py-16 px-8 border-t border-white/10 bg-white/5 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 dark:bg-surface-100 rounded-xl flex items-center justify-center text-white dark:text-slate-900 text-xs font-black shadow-xl">BI</div>
              <span className="text-xs font-black tracking-[0.3em] text-slate-500 dark:text-slate-400 uppercase">BI Copilot Engine © 2026</span>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
              {['System Monitor', 'API Console', 'Documentation', 'Cloud Status'].map((link) => (
                <a key={link} href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:-translate-y-0.5">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
