const { getSession, formatRecord, enableCors } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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
};

