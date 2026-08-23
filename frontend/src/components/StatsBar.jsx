import React from 'react';
import { Users, Code, Briefcase, Building2, GitFork, Cpu } from 'lucide-react';

export default function StatsBar({ stats }) {
  if (!stats) return null;

  const statItems = [
    {
      label: 'Candidate Nodes',
      value: stats.usersCount || 0,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Skill Nodes',
      value: stats.skillsCount || 0,
      icon: Code,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Job Postings',
      value: stats.jobsCount || 0,
      icon: Briefcase,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Hiring Companies',
      value: stats.companiesCount || 0,
      icon: Building2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Graph Relationships',
      value: stats.relationshipsCount || 0,
      icon: GitFork,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-slate-900/80 border ${item.border} backdrop-blur-sm flex items-center justify-between shadow-sm`}
          >
            <div>
              <p className="text-xs font-medium text-slate-400">{item.label}</p>
              <p className="text-xl font-bold text-white mt-1 tracking-tight">
                {item.value}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

