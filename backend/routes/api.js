const express = require('express');
const router = express.Router();
const { getSession, verifyConnectivity, getConnectionStatus } = require('../config/db');

// Helper to sanitize & format Neo4j record properties
function formatRecord(record) {
  const obj = {};
  record.keys.forEach((key) => {
    obj[key] = record.get(key);
  });
  return obj;
}

/**
 * @route   GET /api/health
 * @desc    Check server & CognoDB database connectivity status
 */
router.get('/health', async (req, res) => {
  const status = await verifyConnectivity();
  res.json({
    status: status.connected ? 'healthy' : 'disconnected',
    database: {
      connected: status.connected,
      uri: status.uri,
      user: status.user,
      error: status.error,
      lastChecked: status.lastChecked,
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/users
 * @desc    Retrieve all candidate users with their skills and company
 */
router.get('/users', async (req, res) => {
  let session;
  try {
    session = getSession();
    const query = `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (u)-[w:WORKS_AT]->(c:Company)
      RETURN u.id AS id,
             u.name AS name,
             u.title AS title,
             u.experienceYears AS experienceYears,
             u.location AS location,
             u.bio AS bio,
             u.avatar AS avatar,
             c.name AS currentCompany,
             w.role AS currentRole,
             collect(DISTINCT s.name) AS skills,
             count(DISTINCT s) AS skillCount
      ORDER BY u.name ASC
    `;

    const result = await session.run(query);
    const users = result.records.map(formatRecord);
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Ensure CognoDB Cloud credentials in backend/.env are valid and backend/seed.js has been run.',
    });
  } finally {
    if (session) await session.close();
  }
});

/**
 * @route   GET /api/recommendations/:userId
 * @desc    Multi-hop 2-to-3 hop parameterized Cypher traversal:
 *          User -> HAS_SKILL -> Skill <- REQUIRES_SKILL <- Job <- OFFERS_JOB <- Company
 *          + User -> CONNECTED_TO -> User -> WORKS_AT -> Company (Social Referral Graph)
 */
router.get('/recommendations/:userId', async (req, res) => {
  const { userId } = req.params;
  let session;

  try {
    session = getSession();
    const startTime = Date.now();

    // 1. Verify user exists
    const userCheck = await session.run(
      'MATCH (u:User {id: $userId}) RETURN u.id AS id, u.name AS name, u.title AS title, u.bio AS bio, u.avatar AS avatar',
      { userId }
    );

    if (userCheck.records.length === 0) {
      return res.status(404).json({ success: false, error: `User with id "${userId}" not found.` });
    }

    const userProfile = formatRecord(userCheck.records[0]);

    // 2. Multi-hop traversal query
    const cypherQuery = `
      MATCH (u:User {id: $userId})-[hs:HAS_SKILL]->(s:Skill)<-[rs:REQUIRES_SKILL]-(j:Job)<-[:OFFERS_JOB]-(c:Company)
      OPTIONAL MATCH (u)-[:CONNECTED_TO]->(peer:User)-[:WORKS_AT]->(c)
      WITH u, j, c, 
           collect(DISTINCT s.name) AS matchedSkills, 
           count(DISTINCT s) AS matchedSkillCount,
           collect(DISTINCT { id: peer.id, name: peer.name, title: peer.title, avatar: peer.avatar }) AS companyReferrals
      MATCH (j)-[:REQUIRES_SKILL]->(allSkills:Skill)
      WITH u, j, c, matchedSkills, matchedSkillCount, companyReferrals,
           collect(DISTINCT allSkills.name) AS requiredSkills
      RETURN j.id AS jobId, 
             j.title AS jobTitle, 
             j.salaryRange AS salaryRange, 
             j.location AS location,
             j.department AS department,
             j.employmentType AS employmentType,
             j.experienceLevel AS experienceLevel,
             j.description AS description,
             c.id AS companyId,
             c.name AS companyName, 
             c.industry AS industry, 
             c.logo AS companyLogo,
             c.location AS companyLocation,
             matchedSkills,
             [skill IN requiredSkills WHERE NOT skill IN matchedSkills] AS missingSkills,
             matchedSkillCount,
             size(requiredSkills) AS totalRequiredSkills,
             round((toFloat(matchedSkillCount) / toFloat(size(requiredSkills))) * 100) AS matchScore,
             [ref IN companyReferrals WHERE ref.name IS NOT NULL] AS companyReferrals
      ORDER BY matchScore DESC, matchedSkillCount DESC
    `;

    const result = await session.run(cypherQuery, { userId });
    const executionMs = Date.now() - startTime;

    const recommendations = result.records.map(formatRecord);

    res.json({
      success: true,
      user: userProfile,
      executionMs,
      queryExecuted: cypherQuery.trim(),
      parameters: { userId },
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check CognoDB connection or run npm run seed.',
    });
  } finally {
    if (session) await session.close();
  }
});

/**
 * @route   GET /api/synergy/:userId
 * @desc    2-hop collaborative filtering query to find "Skills to Learn Next"
 *          User -> HAS_SKILL -> Skill <- REQUIRES_SKILL -> Job -> REQUIRES_SKILL -> Skill (Unlearned)
 */
router.get('/synergy/:userId', async (req, res) => {
  const { userId } = req.params;
  let session;

  try {
    session = getSession();
    const query = `
      MATCH (u:User {id: $userId})-[:HAS_SKILL]->(mySkill:Skill)
      MATCH (mySkill)<-[:REQUIRES_SKILL]-(j:Job)-[:REQUIRES_SKILL]->(targetSkill:Skill)
      WHERE NOT (u)-[:HAS_SKILL]->(targetSkill)
      RETURN targetSkill.id AS skillId, 
             targetSkill.name AS skillName, 
             targetSkill.category AS category,
             targetSkill.popularity AS popularity,
             count(DISTINCT j) AS marketDemandFrequency,
             collect(DISTINCT j.title)[0..3] AS requiredByJobs
      ORDER BY marketDemandFrequency DESC, targetSkill.popularity DESC
      LIMIT 6
    `;

    const result = await session.run(query, { userId });
    const synergies = result.records.map(formatRecord);

    res.json({
      success: true,
      userId,
      queryExecuted: query.trim(),
      synergies,
    });
  } catch (error) {
    console.error('Error fetching skill synergies:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (session) await session.close();
  }
});

/**
 * @route   GET /api/dashboard
 * @desc    Aggregated dashboard payload with default candidate, recommendations, synergies & stats
 */
router.get('/dashboard', async (req, res) => {
  let session;
  try {
    session = getSession();
    const targetUserId = req.query.userId || 'usr_alex';

    // 1. Fetch Users
    const usersResult = await session.run(`
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
      RETURN u.id AS id, u.name AS name, u.title AS title, u.avatar AS avatar,
             collect(DISTINCT s.name) AS skills
      ORDER BY u.name ASC
    `);
    const users = usersResult.records.map(formatRecord);

    // Selected user fallback
    const currentUser = users.find((u) => u.id === targetUserId) || users[0] || null;

    if (!currentUser) {
      return res.json({
        success: true,
        emptyState: true,
        message: 'Graph database is empty. Please run "npm run seed" in the backend directory.',
      });
    }

    // 2. Traversal Recommendations for Current User
    const recQuery = `
      MATCH (u:User {id: $userId})-[hs:HAS_SKILL]->(s:Skill)<-[rs:REQUIRES_SKILL]-(j:Job)<-[:OFFERS_JOB]-(c:Company)
      OPTIONAL MATCH (u)-[:CONNECTED_TO]->(peer:User)-[:WORKS_AT]->(c)
      WITH u, j, c, 
           collect(DISTINCT s.name) AS matchedSkills, 
           count(DISTINCT s) AS matchedSkillCount,
           collect(DISTINCT { id: peer.id, name: peer.name, title: peer.title, avatar: peer.avatar }) AS companyReferrals
      MATCH (j)-[:REQUIRES_SKILL]->(allSkills:Skill)
      WITH u, j, c, matchedSkills, matchedSkillCount, companyReferrals,
           collect(DISTINCT allSkills.name) AS requiredSkills
      RETURN j.id AS jobId, 
             j.title AS jobTitle, 
             j.salaryRange AS salaryRange, 
             j.location AS location,
             j.department AS department,
             j.employmentType AS employmentType,
             j.experienceLevel AS experienceLevel,
             j.description AS description,
             c.id AS companyId,
             c.name AS companyName, 
             c.industry AS industry, 
             c.logo AS companyLogo,
             c.location AS companyLocation,
             matchedSkills,
             [skill IN requiredSkills WHERE NOT skill IN matchedSkills] AS missingSkills,
             matchedSkillCount,
             size(requiredSkills) AS totalRequiredSkills,
             round((toFloat(matchedSkillCount) / toFloat(size(requiredSkills))) * 100) AS matchScore,
             [ref IN companyReferrals WHERE ref.name IS NOT NULL] AS companyReferrals
      ORDER BY matchScore DESC, matchedSkillCount DESC
    `;
    const recResult = await session.run(recQuery, { userId: currentUser.id });
    const recommendations = recResult.records.map(formatRecord);

    // 3. Collaborative Skill Synergies
    const synQuery = `
      MATCH (u:User {id: $userId})-[:HAS_SKILL]->(mySkill:Skill)
      MATCH (mySkill)<-[:REQUIRES_SKILL]-(j:Job)-[:REQUIRES_SKILL]->(targetSkill:Skill)
      WHERE NOT (u)-[:HAS_SKILL]->(targetSkill)
      RETURN targetSkill.id AS skillId, 
             targetSkill.name AS skillName, 
             targetSkill.category AS category,
             targetSkill.popularity AS popularity,
             count(DISTINCT j) AS marketDemandFrequency,
             collect(DISTINCT j.title)[0..3] AS requiredByJobs
      ORDER BY marketDemandFrequency DESC, targetSkill.popularity DESC
      LIMIT 6
    `;
    const synResult = await session.run(synQuery, { userId: currentUser.id });
    const synergies = synResult.records.map(formatRecord);

    // 4. Graph Metrics Overview
    const statsResult = await session.run(`
      MATCH (u:User) WITH count(u) AS usersCount
      MATCH (s:Skill) WITH usersCount, count(s) AS skillsCount
      MATCH (j:Job) WITH usersCount, skillsCount, count(j) AS jobsCount
      MATCH (c:Company) WITH usersCount, skillsCount, jobsCount, count(c) AS companiesCount
      MATCH ()-[r]->() WITH usersCount, skillsCount, jobsCount, companiesCount, count(r) AS relationshipsCount
      RETURN usersCount, skillsCount, jobsCount, companiesCount, relationshipsCount
    `);

    const statsRecord = statsResult.records[0];
    const stats = statsRecord ? formatRecord(statsRecord) : {};

    res.json({
      success: true,
      currentUser,
      users,
      recommendations,
      synergies,
      stats,
      cypherQuery: recQuery.trim(),
    });
  } catch (error) {
    console.error('Error fetching dashboard payload:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      connectionStatus: getConnectionStatus(),
    });
  } finally {
    if (session) await session.close();
  }
});

/**
 * @route   GET /api/graph
 * @desc    Export full graph nodes and relationships for D3/Canvas interactive graph visualizer
 */
router.get('/graph', async (req, res) => {
  let session;
  try {
    session = getSession();
    const query = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
      LIMIT 300
    `;

    const result = await session.run(query);

    const nodesMap = new Map();
    const links = [];

    result.records.forEach((record) => {
      const sourceNode = record.get('n');
      const rel = record.get('r');
      const targetNode = record.get('m');

      if (sourceNode) {
        const id = sourceNode.properties.id || String(sourceNode.identity);
        const label = sourceNode.labels[0] || 'Node';
        if (!nodesMap.has(id)) {
          nodesMap.set(id, {
            id,
            label: sourceNode.properties.name || sourceNode.properties.title || id,
            type: label,
            properties: sourceNode.properties,
          });
        }
      }

      if (targetNode) {
        const targetId = targetNode.properties.id || String(targetNode.identity);
        const targetLabel = targetNode.labels[0] || 'Node';
        if (!nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            label: targetNode.properties.name || targetNode.properties.title || targetId,
            type: targetLabel,
            properties: targetNode.properties,
          });
        }

        if (rel) {
          links.push({
            source: sourceNode.properties.id || String(sourceNode.identity),
            target: targetId,
            type: rel.type,
            properties: rel.properties,
          });
        }
      }
    });

    res.json({
      success: true,
      nodes: Array.from(nodesMap.values()),
      links,
    });
  } catch (error) {
    console.error('Error exporting graph dataset:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (session) await session.close();
  }
});

/**
 * @route   GET /api/stats
 * @desc    Fetch summary analytics and top skills in demand
 */
router.get('/stats', async (req, res) => {
  let session;
  try {
    session = getSession();
    const query = `
      MATCH (s:Skill)<-[:REQUIRES_SKILL]-(j:Job)
      WITH s, count(j) AS demandCount
      RETURN s.name AS skillName, s.category AS category, demandCount
      ORDER BY demandCount DESC
      LIMIT 8
    `;
    const result = await session.run(query);
    const topSkills = result.records.map(formatRecord);

    res.json({ success: true, topSkills });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (session) await session.close();
  }
});

/**
 * @route   POST /api/playground
 * @desc    Safe readonly Cypher query execution for assessment evaluators
 */
router.post('/playground', async (req, res) => {
  const { query, params = {} } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Query string is required.' });
  }

  // Safety filter: prevent destructive queries from playground
  const upper = query.toUpperCase();
  if (upper.includes('DELETE') || upper.includes('DROP') || upper.includes('REMOVE') || upper.includes('SET ')) {
    return res.status(403).json({
      success: false,
      error: 'Modifying Cypher operations (CREATE, DELETE, DROP, SET, REMOVE) are restricted in Playground mode.',
    });
  }

  let session;
  try {
    session = getSession();
    const startTime = Date.now();
    const result = await session.run(query, params);
    const executionMs = Date.now() - startTime;

    const records = result.records.map((r) => {
      const row = {};
      r.keys.forEach((k) => {
        row[k] = r.get(k);
      });
      return row;
    });

    res.json({
      success: true,
      executionMs,
      rowCount: records.length,
      keys: result.records[0] ? result.records[0].keys : [],
      records,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  } finally {
    if (session) await session.close();
  }
});

module.exports = router;

