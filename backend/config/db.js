const neo4j = require('neo4j-driver');
const dotenv = require('dotenv');

dotenv.config();

const URI = process.env.COGNODB_URI || 'bolt+s://your-instance-id.databases.cognodb.cloud';
const USER = process.env.COGNODB_USER || 'cognodb';
const PASSWORD = process.env.COGNODB_PASSWORD || '';

let driver = null;
let connectionStatus = {
  connected: false,
  uri: URI,
  user: USER,
  error: null,
  lastChecked: null,
};

/**
 * Initialize and return the Neo4j/CognoDB Driver
 */
function initDriver() {
  if (driver) {
    return driver;
  }

  // Check if credentials are placeholders
  if (!PASSWORD || PASSWORD === 'your_generated_password' || URI.includes('your-instance-id')) {
    connectionStatus = {
      connected: false,
      uri: URI,
      user: USER,
      error: 'CognoDB credentials not configured in backend/.env. Please update COGNODB_URI and COGNODB_PASSWORD.',
      lastChecked: new Date().toISOString(),
    };
    console.warn('\n⚠️ [CognoDB Connection Warning]');
    console.warn(connectionStatus.error);
    console.warn('See README.md for instructions on provisioning your free CognoDB instance.\n');
  }

  try {
    driver = neo4j.driver(
      URI,
      neo4j.auth.basic(USER, PASSWORD),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 10000, // 10 seconds
        disableLosslessIntegers: true, // Auto-convert Neo4j Integers to JS numbers
      }
    );
  } catch (err) {
    console.error('❌ Failed to construct Neo4j driver instance:', err.message);
    connectionStatus = {
      connected: false,
      uri: URI,
      user: USER,
      error: err.message,
      lastChecked: new Date().toISOString(),
    };
  }

  return driver;
}

/**
 * Explicitly verify connectivity with CognoDB / Neo4j instance
 */
async function verifyConnectivity() {
  const drv = initDriver();
  connectionStatus.lastChecked = new Date().toISOString();

  if (!drv) {
    connectionStatus.connected = false;
    return connectionStatus;
  }

  try {
    const serverInfo = await drv.verifyConnectivity();
    connectionStatus.connected = true;
    connectionStatus.error = null;
    connectionStatus.serverInfo = serverInfo;
    console.log(`✅ [CognoDB Connected] Successfully verified Bolt protocol connection to: ${URI}`);
    return connectionStatus;
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    console.error(`❌ [CognoDB Connection Failed] Could not establish connection to ${URI}: ${err.message}`);
    return connectionStatus;
  }
}

/**
 * Acquire a new database session with read/write mode
 */
function getSession(mode = neo4j.session.READ) {
  const drv = initDriver();
  if (!drv) {
    throw new Error('Database driver is not initialized.');
  }
  return drv.session({ defaultAccessMode: mode });
}

/**
 * Get current connectivity diagnostics
 */
function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Safely close the driver pool during application shutdown
 */
async function closeDriver() {
  if (driver) {
    console.log('Closing CognoDB driver connections...');
    await driver.close();
    driver = null;
  }
}

module.exports = {
  initDriver,
  verifyConnectivity,
  getSession,
  getConnectionStatus,
  closeDriver,
};

