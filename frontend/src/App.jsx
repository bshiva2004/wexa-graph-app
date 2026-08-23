import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsBar from './components/StatsBar';
import CandidateSelector from './components/CandidateSelector';
import JobRecommendationCard from './components/JobRecommendationCard';
import SkillSynergyCard from './components/SkillSynergyCard';
import GraphExplorer from './components/GraphExplorer';
import CypherInspector from './components/CypherInspector';
import QueryPlayground from './components/QueryPlayground';
import { LoadingView, EmptyStateView, ErrorStateView } from './components/StateViews';
import { Sparkles, Network, Briefcase, ChevronRight, Layers, Terminal } from 'lucide-react';
import { API_BASE_URL } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'graph' | 'cypher'
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Data states
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [synergies, setSynergies] = useState([]);
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [cypherQuery, setCypherQuery] = useState('');
  const [executionMs, setExecutionMs] = useState(0);

  // Fetch initial dashboard payload
  const fetchDashboardData = useCallback(async (userId = null) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Health check
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      const healthData = await healthRes.json();
      setConnectionStatus(healthData.database);

      if (!healthData.database?.connected) {
        throw new Error(
          healthData.database?.error ||
          'Could not connect to CognoDB. Please verify your credentials in backend/.env and ensure database is online.'
        );
      }

      // 2. Dashboard Aggregation
      const url = userId ? `${API_BASE_URL}/dashboard?userId=${userId}` : `${API_BASE_URL}/dashboard`;
      const dashRes = await fetch(url);
      const dashData = await dashRes.json();

      if (!dashData.success) {
        throw new Error(dashData.error || 'Failed to load graph dashboard data.');
      }

      if (dashData.emptyState) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      setUsers(dashData.users || []);
      setSelectedUser(dashData.currentUser || dashData.users?.[0]);
      setRecommendations(dashData.recommendations || []);
      setSynergies(dashData.synergies || []);
      setStats(dashData.stats || null);
      setCypherQuery(dashData.cypherQuery || '');

      // 3. Fetch Full Graph topology for Explorer
      fetchGraphTopology();
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch graph topology for canvas explorer
  const fetchGraphTopology = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/graph`);
      const data = await res.json();
      if (data.success) {
        setGraphData(data);
      }
    } catch (err) {
      console.warn('Could not load graph topology:', err);
    }
  };

  // Handle Candidate profile change
  const handleSelectUser = async (user) => {
    if (selectedUser?.id === user.id) return;
    setSelectedUser(user);
    setIsSwitchingUser(true);

    try {
      // Fetch user recommendations
      const recRes = await fetch(`${API_BASE_URL}/recommendations/${user.id}`);
      const recData = await recRes.json();

      if (recData.success) {
        setRecommendations(recData.recommendations || []);
        setCypherQuery(recData.queryExecuted || '');
        setExecutionMs(recData.executionMs || 0);
      }

      // Fetch user skill synergies
      const synRes = await fetch(`${API_BASE_URL}/synergy/${user.id}`);
      const synData = await synRes.json();
      if (synData.success) {
        setSynergies(synData.synergies || []);
      }
    } catch (err) {
      console.error('Error switching candidate profile:', err);
    } finally {
      setIsSwitchingUser(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      
      {/* Top Navigation */}
      <Navbar
        connectionStatus={connectionStatus}
        onRefresh={() => fetchDashboardData(selectedUser?.id)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Error State Banner */}
        {error ? (
          <ErrorStateView
            error={error}
            onRetry={() => fetchDashboardData(selectedUser?.id)}
          />
        ) : isLoading ? (
          <LoadingView />
        ) : users.length === 0 ? (
          <EmptyStateView onRefresh={() => fetchDashboardData()} />
        ) : (
          <>
            {/* Top Metric Cards */}
            <StatsBar stats={stats} />

            {/* Candidate Selector Bar */}
            <CandidateSelector
              users={users}
              selectedUser={selectedUser}
              onSelectUser={handleSelectUser}
              isLoading={isSwitchingUser}
            />

            {/* Tab 1: Recommendations & Synergies View */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-lg font-bold text-white">
                        Recommended Opportunities for {selectedUser?.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ranked by multi-hop graph match score, missing skill gap analysis, and 1st-degree peer insider referrals
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400">
                    <span>Active Profile:</span>
                    <span className="font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                      {selectedUser?.title}
                    </span>
                  </div>
                </div>

                {/* Job Recommendation Grid */}
                {isSwitchingUser ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-72 bg-slate-900/60 rounded-2xl border border-slate-800" />
                    ))}
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
                    <p className="text-sm">No direct job matches found for this candidate's skill graph yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.map((rec, idx) => (
                      <JobRecommendationCard
                        key={idx}
                        recommendation={rec}
                        candidateName={selectedUser?.name}
                      />
                    ))}
                  </div>
                )}

                {/* Skill Synergies ("What to Learn Next") */}
                <SkillSynergyCard
                  synergies={synergies}
                  candidateName={selectedUser?.name}
                />

              </div>
            )}

            {/* Tab 2: Interactive 2D Graph Explorer */}
            {activeTab === 'graph' && (
              <div className="space-y-4">
                <GraphExplorer graphData={graphData} isLoading={isLoading} />
              </div>
            )}

            {/* Tab 3: Cypher Query Inspector & Playground */}
            {activeTab === 'cypher' && (
              <div className="space-y-6">
                <CypherInspector
                  cypherQuery={cypherQuery}
                  selectedUser={selectedUser}
                  executionMs={executionMs}
                />
                <QueryPlayground />
              </div>
            )}

          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 font-medium">Wexa AI Take-Home Assessment</span>
            <span>•</span>
            <span>CognoDB Graph Engine & openCypher over Bolt</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span>Bolt 5.0-5.4</span>
            <span>•</span>
            <span>React 18 + Tailwind CSS</span>
            <span>•</span>
            <span>Node.js Express</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

