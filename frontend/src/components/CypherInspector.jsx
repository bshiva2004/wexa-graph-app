import React, { useState } from 'react';
import { Terminal, Copy, Check, Info, Cpu, Zap, ArrowRight } from 'lucide-react';

export default function CypherInspector({
  cypherQuery,
  selectedUser,
  executionMs = 12
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(cypherQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleParams = JSON.stringify({ userId: selectedUser?.id || 'usr_alex' }, null, 2);

  return (
    <div className="space-y-6">
      
      {/* Cypher Code Box */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Live Parameterized Cypher Query
              </h2>
              <p className="text-xs text-slate-400">
                Executed via official Neo4j Bolt driver against CognoDB Cloud instance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-xs font-mono text-emerald-400 border border-slate-800">
              <Zap className="w-3.5 h-3.5" />
              <span>Latency: ~{executionMs || 8}ms</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Query'}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-slate-950 rounded-xl p-4 border border-slate-800/80 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed">
            <pre className="text-emerald-400">
              {cypherQuery || `MATCH (u:User {id: $userId})-[hs:HAS_SKILL]->(s:Skill)<-[rs:REQUIRES_SKILL]-(j:Job)<-[:OFFERS_JOB]-(c:Company)
OPTIONAL MATCH (u)-[:CONNECTED_TO]->(peer:User)-[:WORKS_AT]->(c)
WITH u, j, c, 
     collect(DISTINCT s.name) AS matchedSkills, 
     count(DISTINCT s) AS matchedSkillCount,
     collect(DISTINCT { name: peer.name, title: peer.title }) AS companyReferrals
MATCH (j)-[:REQUIRES_SKILL]->(allSkills:Skill)
WITH u, j, c, matchedSkills, matchedSkillCount, companyReferrals,
     collect(DISTINCT allSkills.name) AS requiredSkills
RETURN j.id AS jobId, j.title AS jobTitle, j.salaryRange AS salaryRange, j.location AS location,
       c.name AS companyName, c.industry AS industry,
       matchedSkills,
       [skill IN requiredSkills WHERE NOT skill IN matchedSkills] AS missingSkills,
       matchedSkillCount,
       size(requiredSkills) AS totalRequiredSkills,
       round((toFloat(matchedSkillCount) / toFloat(size(requiredSkills))) * 100) AS matchScore,
       companyReferrals
ORDER BY matchScore DESC, matchedSkillCount DESC`}
            </pre>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">Query Parameters ($params)</p>
              <pre className="font-mono text-xs text-amber-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {sampleParams}
              </pre>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Security Note:</span> Queries strictly use parameter binding, eliminating Cypher injection risks.
            </div>
          </div>
        </div>
      </div>

      {/* Why Graph Beats SQL Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Graph Traversal Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <Cpu className="w-5 h-5" />
            <h3 className="font-bold text-sm">CognoDB Index-Free Adjacency (O(k))</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            In CognoDB, nodes point directly to adjacent nodes via bidirectional memory pointers. Traversal execution time is proportional only to the number of relationships traversed ($O(k)$), remaining sub-millisecond even as the total database grows to billions of nodes.
          </p>
          <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-xs text-emerald-300 font-mono">
            (:User)-[:HAS_SKILL]-&gt;(:Skill)&lt;-[:REQUIRES]-(:Job)&lt;-[:OFFERS]-(:Company)
          </div>
        </div>

        {/* Relational SQL Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-rose-500/30 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-rose-400 mb-3">
            <Info className="w-5 h-5" />
            <h3 className="font-bold text-sm">Relational SQL Multi-Join Bottleneck (O(n^k))</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            A relational database requires 5+ table joins (<code className="text-slate-200">users</code>, <code className="text-slate-200">user_skills</code>, <code className="text-slate-200">skills</code>, <code className="text-slate-200">job_skills</code>, <code className="text-slate-200">jobs</code>, <code className="text-slate-200">companies</code>, <code className="text-slate-200">user_connections</code>) plus nested subqueries. Global index lookups degrade exponentially under scale.
          </p>
          <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/40 text-xs text-rose-300 font-mono truncate">
            SELECT * FROM users JOIN user_skills JOIN job_skills JOIN jobs...
          </div>
        </div>

      </div>

    </div>
  );
}

