const { getDriver, enableCors, URI, USER } = require('./db');

module.exports = async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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
};

