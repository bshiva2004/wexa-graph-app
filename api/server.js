const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const neo4j = require('neo4j-driver');

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Database connection
const URI = process.env.COGNODB_URI || 'bolt+s://db-c18b0f53.bravo.databases.cognodb.com';
const USER = process.env.COGNODB_USER || 'cognodb';
const PASSWORD = process.env.COGNODB_PASSWORD || '2c0f8a326d5f9fc8a97318c7ca5cb210';

let driver = null;
function getDriver() {
  if (!driver) {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
      disableLosslessIntegers: true,
      maxConnectionPoolSize: 20,
    });
  }
  return driver;
}

function getSession() {
  return getDriver().session();
}

function formatRecord(record) {
  const obj = {};
  record.keys.forEach((key) => {
    obj[key] = record.get(key);
  });
  return obj;
}

// 1. Health Check
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const drv = getDriver();
    await drv.verifyConnectivity();
    res.json({
      status: 'healthy',
      database: {
        connected: true,
        uri: URI,
        user: USER,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(503).json({
      status: 'disconnected',
      database: {
        connected: false,
        uri: URI,
        user: USER,
        error: err.message,
        lastChecked: new Date().toISOString(),
      },
    });
  }
});

// 2. Users
app.get(['/api/users', '/users'], async (req, res) => {
  let session;
  try {
    session = getSession();
    const result = await session.run(`
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (u)-[w:WORKS_AT]->(c:Company)
      RETURN u.id AS id, u.name AS name, u.title AS title, u.experienceYears AS experienceYears,
             u.location AS location, u.bio AS bio, u.avatar AS avatar,
             c.name AS currentCompany, w.role AS currentRole,
             collect(DISTINCT s.name) AS skills
      ORDER BY u.name ASC
    `);
    const users = result.records.map(formatRecord);
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (session) await session.close();
  }
});

// 3. Dashboard
app.get(['/api/dashboard', '/dashboard'], async (req, res) => {
  let session;
  try {
    session = getSession();
    const targetUserId = req.query.userId || 'usr_alex';

    const usersResult = await session.run(`
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
      RETURN u.id AS id, u.name AS name, u.title AS title, u.avatar AS avatar,
             collect(DISTINCT s.name) AS skills
      ORDER BY u.name ASC
    `);
    const users = usersResult.records.map(formatRecord);
    const currentUser = users.find((u) => u.id === targetUserId) || users[0] || null;

    if (!currentUser) {
      return res.json({ success: true, emptyState: true, message: 'Database empty' });
    }

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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (session) await session.close();
  }
});

// 4. Recommendations
app.get(['/api/recommendations', '/api/recommendations/:userId', '/recommendations'], async (req, res) => {
  const userId = req.params.userId || req.query.userId || req.query.id || 'usr_alex';
  let session;
  try {
    session = getSession();
    const startTime = Date.now();

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
    const recResult = await session.run(recQuery, { userId });
    const recommendations = recResult.records.map(formatRecord);
    const executionMs = Date.now() - startTime;

    res.json({
      success: true,
      executionMs,
      queryExecuted: recQuery.trim(),
      parameters: { userId },
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (session) await session.close();
  }
});

// 5. Skill Synergy
app.get(['/api/synergy', '/api/synergy/:userId', '/synergy'], async (req, res) => {
  const userId = req.params.userId || req.query.userId || req.query.id || 'usr_alex';
  let session;
  try {
    session = getSession();
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
    const synResult = await session.run(synQuery, { userId });
    const synergies = synResult.records.map(formatRecord);
    res.json({ success: true, userId, synergies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (session) await session.close();
  }
});

// 6. Graph Topology
app.get(['/api/graph', '/graph'], async (req, res) => {
  let session;
  try {
    session = getSession();
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
      LIMIT 300
    `);

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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (session) await session.close();
  }
});

// 7. Playground
app.post(['/api/playground', '/playground'], async (req, res) => {
  const { query, params = {} } = req.body || {};
  if (!query) return res.status(400).json({ success: false, error: 'Query required' });

  const upper = query.toUpperCase();
  if (upper.includes('DELETE') || upper.includes('DROP') || upper.includes('REMOVE') || upper.includes('SET ')) {
    return res.status(403).json({ success: false, error: 'Mutating queries restricted' });
  }

  let session;
  try {
    session = getSession();
    const startTime = Date.now();
    const result = await session.run(query, params);
    const executionMs = Date.now() - startTime;
    const records = result.records.map(formatRecord);
    res.json({
      success: true,
      executionMs,
      rowCount: records.length,
      keys: result.records[0] ? result.records[0].keys : [],
      records,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  } finally {
    if (session) await session.close();
  }
});

module.exports = app;
