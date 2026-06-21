let pool;

function shouldUseMock() {
  return process.env.USE_MOCK_DB !== 'false';
}

function getPool() {
  if (shouldUseMock()) {
    return null;
  }

  if (!pool) {
    const mysql = require('mysql2/promise');

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'novashelf',
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }

  return pool;
}

module.exports = {
  getPool,
  shouldUseMock
};
