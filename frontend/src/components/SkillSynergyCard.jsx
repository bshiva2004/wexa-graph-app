import React from 'react';
import { Lightbulb, TrendingUp, Briefcase, Zap } from 'lucide-react';

export default function SkillSynergyCard({ synergies = [], candidateName }) {
  if (!synergies || synergies.length === 0) return null;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              High-Yield Skills to Learn Next
            </h2>
            <p className="text-xs text-slate-400">
              Discovered via 2-hop collaborative filtering on jobs requiring {candidateName}'s current skills
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
          Cypher Synergy Matrix
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {synergies.map((syn, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {syn.skillName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {syn.category || 'Skill'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-amber-400 font-medium mb-2.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>In Demand by {syn.marketDemandFrequency} open roles</span>
              </div>

              {syn.requiredByJobs && syn.requiredByJobs.length > 0 && (
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500 block mb-1">Target Roles:</span>
                  <ul className="space-y-0.5">
                    {syn.requiredByJobs.map((job, jIdx) => (
                      <li key={jIdx} className="truncate text-slate-300 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                        <span className="truncate">{job}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Popularity: {syn.popularity || 85}/100</span>
              <span className="text-emerald-400 font-semibold">+Unlock Matches</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

