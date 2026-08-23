const neo4j = require('neo4j-driver');

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

function enableCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

module.exports = {
  getDriver,
  getSession,
  formatRecord,
  enableCors,
  URI,
  USER,
};

