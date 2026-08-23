const { getSession, formatRecord, enableCors } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extract userId from query or path
  const userId = req.query.userId || req.query.id || 'usr_alex';
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
};

