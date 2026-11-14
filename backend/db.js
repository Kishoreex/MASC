require('dotenv').config();
const sql = require('mssql');
let pool;
async function db() {
  if (!pool) {
    pool = new sql.ConnectionPool({
      server: process.env.DB_SERVER,
      port: Number(process.env.DB_PORT || 1433),
      database: process.env.DB_NAME || 'MadhaCollege',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: process.env.DB_ENCRYPT !== 'false',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    }).connect().catch(e => { pool = null; throw e; });
  }
  return pool;
}
module.exports = {db, sql};
