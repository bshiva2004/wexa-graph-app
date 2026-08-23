import React from 'react';
import { Network, Database, RefreshCw, Layers, Terminal, Sparkles, Activity } from 'lucide-react';

export default function Navbar({
  connectionStatus,
  onRefresh,
  activeTab,
  setActiveTab,
  stats
}) {
  const isConnected = connectionStatus?.connected;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Wexa AI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  CognoDB Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                Graph-Powered Talent & Skill Recommendation Network
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-sm">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'recommendations'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Recommendations</span>
              <span className="md:hidden">Matches</span>
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'graph'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Graph Explorer</span>
              <span className="md:hidden">Graph</span>
            </button>

            <button
              onClick={() => setActiveTab('cypher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'cypher'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden md:inline">Cypher Inspector</span>
              <span className="md:hidden">Cypher</span>
            </button>
          </div>

          {/* Connection Status & Actions */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                isConnected
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
              }`}
              title={isConnected ? `Bolt connected to: ${connectionStatus?.uri}` : connectionStatus?.error || 'Database Offline'}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="hidden lg:inline">{isConnected ? 'CognoDB Connected' : 'DB Disconnected'}</span>
            </div>

            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Graph Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

