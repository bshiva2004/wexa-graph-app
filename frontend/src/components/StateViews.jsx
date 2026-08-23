import React from 'react';
import { AlertOctagon, RefreshCw, Database, Terminal, CheckCircle2, Sparkles, ServerCrash } from 'lucide-react';

/**
 * Loading Skeleton View
 */
export function LoadingView() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Bar Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-900/60 rounded-xl border border-slate-800" />
        ))}
      </div>

      {/* Candidate Selector Skeleton */}
      <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />

      {/* Recommendation Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-72 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                <div className="space-y-2">
                  <div className="w-36 h-4 bg-slate-800 rounded" />
                  <div className="w-24 h-3 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="w-14 h-12 bg-slate-800 rounded-xl" />
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full" />
            <div className="flex gap-2">
              <div className="w-16 h-6 bg-slate-800 rounded-md" />
              <div className="w-20 h-6 bg-slate-800 rounded-md" />
              <div className="w-16 h-6 bg-slate-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Friendly Empty State View
 */
export function EmptyStateView({ onRefresh }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto my-12 shadow-2xl backdrop-blur-sm">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Graph Database is Empty</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Your CognoDB instance is connected, but no nodes or relationships have been seeded yet. Run the included seed script to load realistic candidates, skills, jobs, and companies.
      </p>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left font-mono text-xs text-emerald-400 mb-6 space-y-1.5 shadow-inner">
        <p className="text-slate-500"># Navigate to backend directory and run seed:</p>
        <p className="text-slate-200">cd backend</p>
        <p className="text-emerald-400 font-bold">npm run seed</p>
      </div>

      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Check Database Again</span>
      </button>
    </div>
  );
}

/**
 * Bold, Graceful Offline / Error State View
 */
export function ErrorStateView({ error, onRetry }) {
  return (
    <div className="bg-gradient-to-b from-rose-950/40 to-slate-900/90 border border-rose-800/60 rounded-3xl p-8 sm:p-10 text-slate-200 max-w-3xl mx-auto my-8 shadow-2xl backdrop-blur-md">
      
      {/* Icon & Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-inner">
          <ServerCrash className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            CognoDB Cloud Database Unreachable
          </h2>
          <p className="text-sm text-rose-300/80 mt-1">
            Could not establish a Bolt protocol connection to your CognoDB instance
          </p>
        </div>
      </div>

      {/* Error Detail Log Box */}
      <div className="bg-slate-950/90 border border-rose-900/50 rounded-xl p-4 mb-6 font-mono text-xs text-rose-400 overflow-x-auto shadow-inner">
        <div className="flex items-center justify-between text-slate-500 pb-2 mb-2 border-b border-slate-800">
          <span>Diagnostic Log</span>
          <span>Status: 503 Service Unavailable</span>
        </div>
        <p className="leading-relaxed">
          {error || 'ECONNREFUSED or credentials missing in backend/.env file.'}
        </p>
      </div>

      {/* Fast Resolution Steps */}
      <div className="space-y-3 mb-8">
        <h3 className="text-sm font-semibold text-white">How to connect your CognoDB instance:</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">1. Provision Free CognoDB</span>
            <p className="text-slate-400">
              Sign up at <span className="text-slate-300 underline">console.cognodb.com</span> and create a free (c0) instance.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">2. Configure backend/.env</span>
            <p className="text-slate-400">
              Set <code className="text-slate-300">COGNODB_URI</code> and <code className="text-slate-300">COGNODB_PASSWORD</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">3. Seed Database</span>
            <p className="text-slate-400">
              Run <code className="text-emerald-400">npm run seed</code> inside the <code className="text-slate-300">/backend</code> folder.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">4. Start Server</span>
            <p className="text-slate-400">
              Run <code className="text-emerald-400">npm start</code> in <code className="text-slate-300">/backend</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Bolt Connection</span>
        </button>
        <span className="text-xs text-slate-400">
          The server actively retries and refreshes connectivity diagnostics on each check.
        </span>
      </div>

    </div>
  );
}

