import React from 'react';
import { User, Briefcase, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CandidateSelector({
  users = [],
  selectedUser,
  onSelectUser,
  isLoading
}) {
  if (!users || users.length === 0) return null;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Select Candidate Profile</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch candidates to run parameterized multi-hop Cypher queries across their skills & networks
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Nodes: <strong className="text-white">{users.length} Candidates</strong></span>
        </div>
      </div>

      {/* Candidate Profile Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {users.map((u) => {
          const isSelected = selectedUser?.id === u.id;

          return (
            <button
              key={u.id}
              onClick={() => onSelectUser(u)}
              disabled={isLoading}
              className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              )}

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                    alt={u.name}
                    className={`w-9 h-9 rounded-full object-cover border ${
                      isSelected ? 'border-emerald-400' : 'border-slate-700'
                    }`}
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                      {u.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {u.title?.split('&')[0] || u.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {u.skills?.slice(0, 2).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50 truncate max-w-[100px]"
                    >
                      {skill}
                    </span>
                  ))}
                  {u.skills?.length > 2 && (
                    <span className="text-[10px] px-1 py-0.5 text-slate-500 font-mono">
                      +{u.skills.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{u.experienceYears ? `${u.experienceYears}y exp` : 'Candidate'}</span>
                <span className="font-mono text-emerald-400/80 text-[10px]">
                  {u.id}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

