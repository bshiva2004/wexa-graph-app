const { getSession, formatRecord, enableCors } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (session) await session.close();
  }
};

