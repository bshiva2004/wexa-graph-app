const { getSession, formatRecord, enableCors } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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
};

