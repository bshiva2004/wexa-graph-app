import React from 'react';
import { Building2, MapPin, DollarSign, CheckCircle, AlertCircle, Users, ArrowRight, Sparkles, Network } from 'lucide-react';

export default function JobRecommendationCard({ recommendation, candidateName }) {
  const {
    jobTitle,
    companyName,
    companyLogo,
    industry,
    location,
    salaryRange,
    employmentType,
    experienceLevel,
    description,
    matchedSkills = [],
    missingSkills = [],
    matchedSkillCount = 0,
    totalRequiredSkills = 0,
    matchScore = 0,
    companyReferrals = [],
  } = recommendation;

  // Score color gradient
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
      
      {/* Header: Company & Match Score */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
              {companyLogo || '🏢'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {jobTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="text-slate-200">{companyName}</span>
                <span>•</span>
                <span>{industry}</span>
              </p>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className={`px-3.5 py-2 rounded-xl border flex flex-col items-center justify-center min-w-[76px] ${getScoreColor(matchScore)}`}>
            <span className="text-xl font-extrabold tracking-tight">{matchScore}%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Match</span>
          </div>
        </div>

        {/* Job Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-300">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>{salaryRange || 'Competitive'}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>{location}</span>
          </div>
          {employmentType && (
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
              {employmentType}
            </span>
          )}
          {experienceLevel && (
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50 text-slate-400">
              {experienceLevel}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Match Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Skill Alignment</span>
            <span className="text-slate-200 font-mono font-semibold">
              {matchedSkillCount} of {totalRequiredSkills} Skills
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(matchScore)}`}
              style={{ width: `${Math.max(matchScore, 5)}%` }}
            />
          </div>
        </div>

        {/* Skills Breakdown */}
        <div className="mt-4 space-y-2.5">
          {/* Matched Skills */}
          {matchedSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mb-1.5">
                <CheckCircle className="w-3 h-3" />
                <span>Matched Skills ({matchedSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills (Skill Gap) */}
          {missingSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/90 mb-1.5">
                <AlertCircle className="w-3 h-3" />
                <span>Skills to Acquire ({missingSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Social Graph Insider Referrals */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/90 flex flex-col gap-2">
        {companyReferrals && companyReferrals.length > 0 ? (
          <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <div className="text-xs">
                <span className="text-blue-300 font-semibold">
                  {companyReferrals.length} Peer Connection{companyReferrals.length > 1 ? 's' : ''}
                </span>{' '}
                <span className="text-slate-400">at {companyName}:</span>
                <span className="text-slate-200 font-medium ml-1">
                  {companyReferrals.map((r) => r.name).join(', ')}
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
              Referral
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Network className="w-3.5 h-3.5 text-slate-600" />
            <span>2-Hop Traversal: <code className="text-slate-400 font-mono">(:User)-[:HAS_SKILL]-&gt;(:Skill)&lt;-[:REQUIRES]-(:Job)</code></span>
          </div>
        )}
      </div>

    </div>
  );
}

