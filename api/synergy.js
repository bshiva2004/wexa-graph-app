const { getSession, formatRecord, enableCors } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = req.query.userId || req.query.id || 'usr_alex';
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
};

