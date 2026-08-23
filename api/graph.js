const { getSession, enableCors } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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
};

