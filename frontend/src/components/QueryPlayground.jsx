import React, { useState } from 'react';
import { Play, Code, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

const PRESET_QUERIES = [
  {
    label: 'Top 5 In-Demand Skills Across All Jobs',
    query: `MATCH (s:Skill)<-[:REQUIRES_SKILL]-(j:Job)
RETURN s.name AS Skill, s.category AS Category, count(j) AS DemandCount
ORDER BY DemandCount DESC
LIMIT 5`,
  },
  {
    label: 'Find 2-Hop Colleagues Who Work at Wexa AI',
    query: `MATCH (u:User)-[:CONNECTED_TO]->(peer:User)-[:WORKS_AT]->(c:Company {name: 'Wexa AI'})
RETURN u.name AS Candidate, peer.name AS ColleagueAtWexa, c.name AS Company`,
  },
  {
    label: 'Identify Multi-Disciplinary Full-Stack Candidates',
    query: `MATCH (u:User)-[:HAS_SKILL]->(s:Skill)
WITH u, collect(s.name) AS skills, collect(DISTINCT s.category) AS categories
WHERE size(categories) >= 3
RETURN u.name AS Candidate, u.title AS Role, size(skills) AS TotalSkills, categories AS SkillCategories`,
  },
  {
    label: 'Graph Schema: Count Nodes by Label',
    query: `MATCH (n)
RETURN labels(n)[0] AS NodeLabel, count(n) AS TotalCount
ORDER BY TotalCount DESC`,
  }
];

export default function QueryPlayground() {
  const [customQuery, setCustomQuery] = useState(PRESET_QUERIES[0].query);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRunQuery = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/playground`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute query');
      }
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Live openCypher Sandbox</h2>
            <p className="text-xs text-slate-400">Execute custom read queries directly on the live CognoDB graph instance</p>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleRunQuery}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
          <span>{isRunning ? 'Traversing Graph...' : 'Run Query'}</span>
        </button>
      </div>

      {/* Presets */}
      <div>
        <span className="text-xs text-slate-400 font-medium block mb-2">Preset Cypher Traversal Scenarios:</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCustomQuery(preset.query);
                setResults(null);
                setError(null);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-white transition-all text-left"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Editor */}
      <div className="relative">
        <textarea
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner"
          placeholder="MATCH (n) RETURN n LIMIT 10"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold">Query Execution Error</p>
            <p className="text-rose-400/90 font-mono mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results && results.records && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Result: <strong className="text-white">{results.rowCount} records</strong> returned</span>
            <span className="font-mono text-emerald-400">Latency: {results.executionMs}ms</span>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono">
                  {results.keys.map((k) => (
                    <th key={k} className="px-4 py-2 font-semibold">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono text-slate-300">
                {results.records.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/40">
                    {results.keys.map((k) => (
                      <td key={k} className="px-4 py-2 truncate max-w-xs">
                        {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

