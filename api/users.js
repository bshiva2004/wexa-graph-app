const { getSession, formatRecord, enableCors } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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
};

